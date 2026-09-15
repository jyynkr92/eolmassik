import type { Rounding } from '@/types/settlement'

import type { Transfer } from './types'

/** 반올림 단위. `none` 은 1원 단위라 올림이 아무것도 바꾸지 않는다. 기획설계 4.3 */
const ROUNDING_UNIT: Record<Rounding, number> = {
  none: 1,
  ceil10: 10,
  ceil100: 100,
}

const roundUp = (value: number, unit: number) => Math.ceil(value / unit) * unit

export type RoundedTransfers = {
  transfers: Transfer[]
  /** 올림 때문에 더 걷힌 금액. 받는 사람(보통 결제자) 이득이다. 기획설계 4.3 */
  excess: number
}

/**
 * 송금 금액을 올림한다. 기획설계 4.3
 *
 * 항목별 부담액이 아니라 **송금액**에 적용한다. 항목 단위로 올리면 손해가 항목 수만큼
 * 누적되는데(10,000원 항목 10개면 1인당 2,000원), 정작 송금액은 결제액을 뺀 값이라
 * 딱 떨어지지도 않는다. 올림의 목적은 "실제 송금 시 금액이 깔끔해지는 것"이다.
 *
 * 보낼 **총액** 기준으로 한 사람당 한 번만 올린다. 여러 명에게 쪼개 보내는 경우
 * 차액은 가장 큰 송금 건에 얹는다. 보내는 쪽이 더 보내면 받는 쪽은 그만큼 더 받는다.
 */
export const roundTransfers = (transfers: Transfer[], rounding: Rounding): RoundedTransfers => {
  // NOTE: 검증되지 않은 rounding 값이 들어와도 금액이 NaN 이 되지 않게 1원 단위로 떨어뜨린다.
  const unit = ROUNDING_UNIT[rounding] ?? 1
  if (unit <= 1) return { transfers, excess: 0 }

  const sentById = new Map<string, number>()
  for (const transfer of transfers) {
    sentById.set(transfer.fromId, (sentById.get(transfer.fromId) ?? 0) + transfer.amount)
  }

  const gapById = new Map<string, number>()
  for (const [id, sent] of sentById) gapById.set(id, roundUp(sent, unit) - sent)

  // 차액을 얹을 대상은 보내는 사람마다 가장 큰 송금 건 하나다.
  const targetIndexById = new Map<string, number>()
  transfers.forEach((transfer, index) => {
    const current = targetIndexById.get(transfer.fromId)
    if (current === undefined) {
      targetIndexById.set(transfer.fromId, index)
      return
    }
    if (transfer.amount > (transfers[current]?.amount ?? 0)) {
      targetIndexById.set(transfer.fromId, index)
    }
  })

  const rounded = transfers.map((transfer, index) => {
    if (targetIndexById.get(transfer.fromId) !== index) return transfer

    const gap = gapById.get(transfer.fromId) ?? 0
    if (gap === 0) return transfer
    return { ...transfer, amount: transfer.amount + gap }
  })

  const excess = [...gapById.values()].reduce((acc, gap) => acc + gap, 0)
  return { transfers: rounded, excess }
}
