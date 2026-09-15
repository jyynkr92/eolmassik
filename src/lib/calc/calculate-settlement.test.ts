import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { DEFAULT_OPTIONS } from '@/constants/settlement'
import type { Settlement } from '@/types/settlement'

import { arbitrarySettlement } from './arbitraries'
import { calculateSettlement } from './calculate-settlement'

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

const settlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  id: 's0',
  title: '9/15 캠핑',
  createdAt: 0,
  participants: [],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: null,
  ...overrides,
})

describe('calculateSettlement', () => {
  it('결제자와 부담자를 분리해 순액과 송금을 낸다', () => {
    const result = calculateSettlement(
      settlement({
        participants: [
          { id: 'p0', name: '은정', headcount: 1 },
          { id: 'p1', name: '민수', headcount: 1 },
        ],
        items: [
          {
            id: 'i0',
            name: '고기',
            amount: 30_000,
            payerId: 'p0',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
          {
            id: 'i1',
            name: '음료',
            amount: 10_000,
            payerId: 'p1',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
        ],
      }),
    )

    expect(result.totalAmount).toBe(40_000)
    expect(result.balances).toEqual([
      { participantId: 'p0', paid: 30_000, owed: 20_000, net: 10_000 },
      { participantId: 'p1', paid: 10_000, owed: 20_000, net: -10_000 },
    ])
    expect(result.transfers).toEqual([{ fromId: 'p1', toId: 'p0', amount: 10_000 }])
  })

  it('참여자 목록에 없는 결제자는 집계하지 않는다', () => {
    const result = calculateSettlement(
      settlement({
        participants: [{ id: 'p0', name: '은정', headcount: 1 }],
        items: [
          {
            id: 'i0',
            name: '고기',
            amount: 30_000,
            payerId: '유령',
            participantIds: ['p0'],
            extraCharges: [],
          },
        ],
      }),
    )

    expect(result.balances).toEqual([{ participantId: 'p0', paid: 0, owed: 30_000, net: -30_000 }])
    expect(result.transfers).toEqual([])
  })

  it('항목이 없으면 전원 순액이 0이다', () => {
    const result = calculateSettlement(
      settlement({ participants: [{ id: 'p0', name: '은정', headcount: 1 }] }),
    )

    expect(result.totalAmount).toBe(0)
    expect(result.balances).toEqual([{ participantId: 'p0', paid: 0, owed: 0, net: 0 }])
    expect(result.transfers).toEqual([])
  })

  describe('property', () => {
    it('rounding 이 none 이면 전체 부담액의 합 == 전체 결제액의 합 == 총액', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement({
            ...generated,
            options: { ...generated.options, rounding: 'none' },
          })

          expect(sum(result.balances.map((balance) => balance.owed))).toBe(result.totalAmount)
          expect(sum(result.balances.map((balance) => balance.paid))).toBe(result.totalAmount)
          expect(sum(result.balances.map((balance) => balance.net))).toBe(0)
        }),
      )
    })

    it('올림을 켜면 부담액의 합이 총액 이상이다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated)

          expect(sum(result.balances.map((balance) => balance.owed))).toBeGreaterThanOrEqual(
            result.totalAmount,
          )
        }),
      )
    })

    it('송금을 모두 반영하면 전원 순액이 0이 되고, 건수는 참여자 수보다 적다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated)
          const settled = new Map(
            result.balances.map((balance) => [balance.participantId, balance.net]),
          )

          for (const transfer of result.transfers) {
            settled.set(transfer.fromId, (settled.get(transfer.fromId) ?? 0) + transfer.amount)
            settled.set(transfer.toId, (settled.get(transfer.toId) ?? 0) - transfer.amount)
          }

          expect(result.transfers.length).toBeLessThanOrEqual(generated.participants.length - 1)
          // 올림을 켜면 순액 합이 0이 아니므로 한쪽만 정리된다. 기본 정책에서만 전원 0을 요구한다.
          if (generated.options.rounding !== 'none') return
          for (const net of settled.values()) expect(net).toBe(0)
        }),
      )
    })
  })
})
