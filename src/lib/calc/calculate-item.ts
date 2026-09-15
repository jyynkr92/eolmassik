import type {
  FullChargeSplit,
  Item,
  Options,
  Participant,
  RoundingAbsorber,
} from '@/types/settlement'

import type { ItemResult, ItemShare } from './types'

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

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
 * 남은 금액을 나눠 가질 가중치.
 *
 * `full` 부담자가 있으면 그들이 전부 가져간다. 없으면 `participantIds` 의 부담자끼리
 * headcount 비례로 N빵한다. 추가 부담만 걸린 사람은 "이 항목에 4,000원만 보탤게" 라는
 * 뜻이므로 N빵 대상이 아니다.
 */
const resolveWeights = (
  bearers: Participant[],
  splitTargetIds: Set<string>,
  fullIds: Set<string>,
  payerIndex: number,
  options: Options,
) => {
  if (bearers.some((bearer) => fullIds.has(bearer.id)))
    return fullChargeWeights(bearers, fullIds, options.fullChargeSplit)

  const weights = bearers.map((bearer) =>
    splitTargetIds.has(bearer.id) ? Math.max(0, bearer.headcount) : 0,
  )
  if (sum(weights) > 0 || payerIndex < 0) return weights

  // 나눠 가질 사람이 아무도 없으면 결제자가 잔액을 진다. 추가 부담만 걸린 사람에게
  // 몰아주면 "3,000원만 보탤게" 가 전액 부담으로 뒤집힌다.
  return bearers.map((_, index) => (index === payerIndex ? 1 : 0))
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

/** 추가 부담을 참여자별로 합친다. 전액 부담이 금액 지정보다 상위 개념이다. */
const collectCharges = (item: Item) => {
  const fullIds = new Set<string>()
  const amountById = new Map<string, number>()

  for (const charge of item.extraCharges) {
    if (charge.type === 'full') {
      fullIds.add(charge.participantId)
      continue
    }
    const previous = amountById.get(charge.participantId) ?? 0
    amountById.set(charge.participantId, previous + Math.max(0, charge.value ?? 0))
  }
  // 한 사람에게 전액과 금액 지정이 함께 걸리면 전액만 남긴다.
  for (const id of fullIds) amountById.delete(id)

  return { fullIds, amountById }
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
 * 3. `full` 부담자가 있으면 `remaining` 을 그들끼리 나눈다. 없으면 N빵한다
 * 4. 내림에서 생긴 잔차를 흡수자에게 몰아준다
 *
 * 부담액의 합은 **항상** `item.amount` 와 같다. 반올림 정책은 여기서 다루지 않고
 * 송금 금액에만 적용한다. 항목 단위로 올리면 손해가 항목 수만큼 누적된다. `round-transfers.ts`
 */
export const calculateItem = (
  item: Item,
  participants: Participant[],
  options: Options,
): ItemResult => {
  // NOTE: 음수 금액 방어. lib/codec 의 Zod 검증이 생기면 그쪽으로 옮긴다.
  const amount = Math.max(0, item.amount)
  const { fullIds, amountById } = collectCharges(item)

  const splitTargetIds = new Set(item.participantIds)
  const hasFullBearer = participants.some((participant) => fullIds.has(participant.id))
  const hasSplitTarget = participants.some(
    (participant) => splitTargetIds.has(participant.id) && participant.headcount > 0,
  )

  // 추가 부담 대상은 participantIds 에서 빠져 있어도 부담자로 본다.
  // 빼버리면 그 사람이 내기로 한 돈이 조용히 사라져 합계가 어긋난다.
  const bearerIds = new Set([
    ...item.participantIds,
    ...item.extraCharges.map((charge) => charge.participantId),
  ])
  // 나눠 가질 사람이 아무도 없으면 결제자를 부담자로 세운다.
  if (!hasFullBearer && !hasSplitTarget) bearerIds.add(item.payerId)

  const bearers = participants.filter((participant) => bearerIds.has(participant.id))
  if (bearers.length === 0) return { itemId: item.id, shares: [], total: 0 }

  const payerIndex = bearers.findIndex((bearer) => bearer.id === item.payerId)
  const rawCharges = bearers.map((bearer) => amountById.get(bearer.id) ?? 0)

  const { charged, remaining } = clampCharges(rawCharges, amount)
  const weights = resolveWeights(bearers, splitTargetIds, fullIds, payerIndex, options)

  const divided = splitByWeight(remaining, weights)
  const absorbed = absorbResidual(
    divided.shares,
    divided.residual,
    payerIndex,
    options.roundingAbsorber,
  )

  const amounts = bearers.map((_, index) => (charged[index] ?? 0) + (absorbed[index] ?? 0))
  return toResult(item, bearers, amounts)
}
