import type {
  FullChargeSplit,
  Item,
  Options,
  Participant,
  Rounding,
  RoundingAbsorber,
} from '@/types/settlement'

import type { ItemResult, ItemShare } from './types'

/** 반올림 단위. `none` 은 1원 단위라 올림이 아무것도 바꾸지 않는다. 기획설계 4.3 */
const ROUNDING_UNIT: Record<Rounding, number> = {
  none: 1,
  ceil10: 10,
  ceil100: 100,
}

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

const roundUp = (value: number, unit: number) => {
  if (unit <= 1) return value
  return Math.ceil(value / unit) * unit
}

type WeightedSplit = {
  shares: number[]
  /** 내림 때문에 남은 금액. 항상 0 이상이다. */
  residual: number
}

/** `total` 을 `weights` 비율로 내림 분배한다. 잔차는 흡수자를 정한 뒤에 따로 얹는다. */
const splitByWeight = (total: number, weights: number[]): WeightedSplit => {
  const weightSum = sum(weights)
  if (weightSum === 0) return { shares: weights.map(() => 0), residual: total }

  const shares = weights.map((weight) => Math.floor((total * weight) / weightSum))
  return { shares, residual: total - sum(shares) }
}

/** 잔차를 앞사람부터 1원씩 돌린다. */
const spreadResidual = (shares: number[], residual: number) => {
  if (shares.length === 0 || residual === 0) return shares

  const base = Math.floor(residual / shares.length)
  const extra = residual % shares.length
  return shares.map((share, index) => share + base + (index < extra ? 1 : 0))
}

const absorbResidual = (
  shares: number[],
  residual: number,
  payerIndex: number,
  absorber: RoundingAbsorber,
) => {
  if (shares.length === 0 || residual === 0) return shares
  if (absorber === 'split') return spreadResidual(shares, residual)

  // 결제자가 부담자가 아니면 첫 부담자가 대신 흡수한다. 잔차를 버릴 수는 없다.
  const index = payerIndex >= 0 ? payerIndex : 0
  return shares.map((share, i) => (i === index ? share + residual : share))
}

/**
 * `full` 부담자끼리 나눌 가중치. 기본은 headcount 를 무시한 n등분이다.
 * headcount 기준인데 전원 0이면 아무도 부담하지 못하므로 n등분으로 되돌린다.
 */
const fullChargeWeights = (
  bearers: Participant[],
  fullIds: Set<string>,
  split: FullChargeSplit,
) => {
  const evenWeights = bearers.map((bearer) => (fullIds.has(bearer.id) ? 1 : 0))
  if (split === 'even') return evenWeights

  const weights = bearers.map((bearer) => (fullIds.has(bearer.id) ? bearer.headcount : 0))
  if (sum(weights) === 0) return evenWeights
  return weights
}

/**
 * `amount` 추가 부담을 확정한다. 합계가 항목 금액을 넘으면 비율로 축소해
 * "부담액 합 == 항목 금액" 불변식을 지킨다. 이때 N빵할 금액은 남지 않는다.
 */
const clampCharges = (rawCharges: number[], amount: number) => {
  const chargeSum = sum(rawCharges)
  if (chargeSum <= amount) return { charged: rawCharges, remaining: amount - chargeSum }

  const split = splitByWeight(amount, rawCharges)
  return { charged: spreadResidual(split.shares, split.residual), remaining: 0 }
}

const toResult = (item: Item, bearers: Participant[], amounts: number[]): ItemResult => {
  const shares: ItemShare[] = bearers.map((bearer, index) => ({
    participantId: bearer.id,
    amount: amounts[index] ?? 0,
  }))
  return { itemId: item.id, shares, total: sum(shares.map((share) => share.amount)) }
}

/**
 * 항목 하나의 참여자별 부담액을 구한다. 기획설계 4.1
 *
 * 1. `amount` 추가 부담을 먼저 확정한다. 합계가 항목 금액을 넘으면 비율로 축소한다
 * 2. 남은 금액(`remaining`)을 구한다
 * 3. `full` 부담자가 있으면 `remaining` 을 그들끼리 나눈다.
 *    없으면 `participantIds` 의 부담자끼리 headcount 비례로 N빵한다
 * 4. 내림에서 생긴 잔차를 흡수자에게 몰아준다
 * 5. `rounding` 이 `none` 이 아니면 각자의 부담액을 올림한다
 *
 * `rounding` 이 `none` 인 동안 부담액의 합은 항상 `item.amount` 와 같다.
 * 올림을 켜면 합계가 항목 금액을 넘고, 초과분은 송금 계산에서 결제자 이득으로 돌아간다. 기획설계 4.3
 */
export const calculateItem = (
  item: Item,
  participants: Participant[],
  options: Options,
): ItemResult => {
  const unit = ROUNDING_UNIT[options.rounding]
  const amount = Math.max(0, item.amount)

  // 추가 부담 대상은 participantIds 에서 빠져 있어도 부담자로 본다.
  // 빼버리면 그 사람이 내기로 한 돈이 조용히 사라져 합계가 어긋난다.
  const bearerIds = new Set([
    ...item.participantIds,
    ...item.extraCharges.map((charge) => charge.participantId),
  ])
  const bearers = participants.filter((participant) => bearerIds.has(participant.id))

  // 부담자가 아무도 없으면 결제자가 전액을 진다.
  if (bearers.length === 0) {
    const payer = participants.find((participant) => participant.id === item.payerId)
    if (!payer) return { itemId: item.id, shares: [], total: 0 }
    return toResult(item, [payer], [roundUp(amount, unit)])
  }

  const fullIds = new Set<string>()
  const chargeByParticipant = new Map<string, number>()
  for (const charge of item.extraCharges) {
    if (charge.type === 'full') {
      fullIds.add(charge.participantId)
      continue
    }
    const previous = chargeByParticipant.get(charge.participantId) ?? 0
    chargeByParticipant.set(charge.participantId, previous + Math.max(0, charge.value ?? 0))
  }
  // 전액 부담이 금액 지정보다 상위 개념이다. 한 사람에게 둘 다 걸리면 전액만 남긴다.
  for (const id of fullIds) chargeByParticipant.delete(id)

  const rawCharges = bearers.map((bearer) => chargeByParticipant.get(bearer.id) ?? 0)
  const payerIndex = bearers.findIndex((bearer) => bearer.id === item.payerId)

  // 1~2. 추가 부담을 확정하고 남은 금액을 구한다.
  const { charged, remaining } = clampCharges(rawCharges, amount)

  // 3. full 부담자가 있으면 남은 금액을 전부 그들이 가져간다.
  // N빵 대상은 participantIds 에 있는 사람뿐이다. 추가 부담만 걸린 사람은
  // "이 항목에 4,000원만 보탤게" 라는 뜻이므로 N빵까지 얹으면 안 된다.
  const hasFullBearer = bearers.some((bearer) => fullIds.has(bearer.id))
  const nBangIds = new Set(item.participantIds)
  const weights = hasFullBearer
    ? fullChargeWeights(bearers, fullIds, options.fullChargeSplit)
    : bearers.map((bearer) => (nBangIds.has(bearer.id) ? Math.max(0, bearer.headcount) : 0))

  // 4. 내림 후 잔차 흡수.
  const divided = splitByWeight(remaining, weights)
  const absorbed = absorbResidual(
    divided.shares,
    divided.residual,
    payerIndex,
    options.roundingAbsorber,
  )

  // 5. 반올림 정책 적용.
  const amounts = bearers.map((_, index) =>
    roundUp((charged[index] ?? 0) + (absorbed[index] ?? 0), unit),
  )
  return toResult(item, bearers, amounts)
}
