import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { Rounding } from '@/types/settlement'

import { roundTransfers } from './round-transfers'
import type { Transfer } from './types'

const ROUNDING_UNIT: Record<Rounding, number> = { none: 1, ceil10: 10, ceil100: 100 }

const transfer = (fromId: string, toId: string, amount: number): Transfer => ({
  fromId,
  toId,
  amount,
})

describe('roundTransfers', () => {
  it('none 이면 아무것도 바꾸지 않는다', () => {
    const transfers = [transfer('p1', 'p0', 9_999)]

    expect(roundTransfers(transfers, 'none')).toEqual({ transfers, excess: 0 })
  })

  it('보낼 금액을 100원 단위로 올리고 초과분을 돌려준다', () => {
    const result = roundTransfers([transfer('p1', 'p0', 9_999)], 'ceil100')

    expect(result.transfers).toEqual([transfer('p1', 'p0', 10_000)])
    expect(result.excess).toBe(1)
  })

  it('이미 딱 떨어지면 그대로 둔다', () => {
    const transfers = [transfer('p1', 'p0', 10_000)]

    expect(roundTransfers(transfers, 'ceil100')).toEqual({ transfers, excess: 0 })
  })

  it('여러 명에게 쪼개 보내면 총액 기준으로 한 번만 올린다', () => {
    // 3,333 + 3,333 = 6,666 → 6,700. 차액 34원은 가장 큰 송금 건에 얹는다.
    const result = roundTransfers(
      [transfer('p2', 'p0', 3_333), transfer('p2', 'p1', 3_333)],
      'ceil100',
    )

    expect(result.transfers).toEqual([transfer('p2', 'p0', 3_367), transfer('p2', 'p1', 3_333)])
    expect(result.excess).toBe(34)
  })

  it('보내는 사람이 여러 명이면 각자 따로 올린다', () => {
    const result = roundTransfers(
      [transfer('p1', 'p0', 9_999), transfer('p2', 'p0', 5_010)],
      'ceil100',
    )

    expect(result.transfers).toEqual([transfer('p1', 'p0', 10_000), transfer('p2', 'p0', 5_100)])
    expect(result.excess).toBe(91)
  })

  it('ceil10 은 10원 단위로 올린다', () => {
    const result = roundTransfers([transfer('p1', 'p0', 3_333)], 'ceil10')

    expect(result.transfers).toEqual([transfer('p1', 'p0', 3_340)])
    expect(result.excess).toBe(7)
  })

  it('송금이 없으면 초과분도 없다', () => {
    expect(roundTransfers([], 'ceil100')).toEqual({ transfers: [], excess: 0 })
  })

  describe('property', () => {
    const arbitraryTransfers = () =>
      fc.array(
        fc.record({
          fromId: fc.constantFrom('p1', 'p2', 'p3'),
          toId: fc.constantFrom('p0', 'p4'),
          amount: fc.integer({ min: 1, max: 200_000 }),
        }),
        { maxLength: 6 },
      )

    const arbitraryRounding = () =>
      fc.constantFrom('none' as const, 'ceil10' as const, 'ceil100' as const)

    const sentById = (transfers: Transfer[]) => {
      const sent = new Map<string, number>()
      for (const item of transfers) {
        sent.set(item.fromId, (sent.get(item.fromId) ?? 0) + item.amount)
      }
      return sent
    }

    it('보내는 사람마다 총액이 단위에 맞춰 올라가고, 한 단위 미만만 늘어난다', () => {
      fc.assert(
        fc.property(arbitraryTransfers(), arbitraryRounding(), (transfers, rounding) => {
          const unit = ROUNDING_UNIT[rounding]
          const before = sentById(transfers)
          const after = sentById(roundTransfers(transfers, rounding).transfers)

          for (const [id, sent] of after) {
            const original = before.get(id) ?? 0
            expect(sent % unit).toBe(0)
            expect(sent - original).toBeGreaterThanOrEqual(0)
            expect(sent - original).toBeLessThan(unit)
          }
        }),
      )
    })

    it('초과분은 늘어난 금액의 합과 같다', () => {
      fc.assert(
        fc.property(arbitraryTransfers(), arbitraryRounding(), (transfers, rounding) => {
          const result = roundTransfers(transfers, rounding)
          const before = transfers.reduce((acc, item) => acc + item.amount, 0)
          const after = result.transfers.reduce((acc, item) => acc + item.amount, 0)

          expect(after - before).toBe(result.excess)
        }),
      )
    })

    it('송금 건수와 상대는 그대로다', () => {
      fc.assert(
        fc.property(arbitraryTransfers(), arbitraryRounding(), (transfers, rounding) => {
          const result = roundTransfers(transfers, rounding)

          expect(result.transfers.map(({ fromId, toId }) => ({ fromId, toId }))).toEqual(
            transfers.map(({ fromId, toId }) => ({ fromId, toId })),
          )
        }),
      )
    })
  })
})
