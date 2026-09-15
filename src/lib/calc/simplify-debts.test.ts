import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { simplifyDebts } from './simplify-debts'
import type { ParticipantBalance } from './types'

const balance = (participantId: string, net: number): ParticipantBalance => ({
  participantId,
  paid: net > 0 ? net : 0,
  owed: net < 0 ? -net : 0,
  net,
})

/** 순액 합이 0인 balances. 정산은 결제액 합과 부담액 합이 같으므로 이게 실제 입력 모양이다. */
const arbitraryBalancedNets = () =>
  fc
    .array(fc.integer({ min: -200_000, max: 200_000 }), { minLength: 1, maxLength: 8 })
    .map((nets) => {
      const total = nets.reduce((acc, net) => acc + net, 0)
      return nets.map((net, index) => balance(`p${index}`, index === 0 ? net - total : net))
    })

describe('simplifyDebts', () => {
  it('기획설계 4.2 예제 — 채권자 1명에게 3건으로 모인다', () => {
    const transfers = simplifyDebts([
      balance('은정', 37_000),
      balance('민수', -14_000),
      balance('철준', -14_000),
      balance('영희', -9_000),
    ])

    expect(transfers).toEqual([
      { fromId: '민수', toId: '은정', amount: 14_000 },
      { fromId: '철준', toId: '은정', amount: 14_000 },
      { fromId: '영희', toId: '은정', amount: 9_000 },
    ])
  })

  it('순액이 0인 사람은 송금에 등장하지 않는다', () => {
    const transfers = simplifyDebts([balance('p0', 5_000), balance('p1', 0), balance('p2', -5_000)])

    expect(transfers).toEqual([{ fromId: 'p2', toId: 'p0', amount: 5_000 }])
  })

  it('전원 순액이 0이면 송금이 없다', () => {
    expect(simplifyDebts([balance('p0', 0), balance('p1', 0)])).toEqual([])
  })

  it('같은 입력이면 항상 같은 결과가 나온다', () => {
    const balances = [
      balance('p0', 10_000),
      balance('p1', 10_000),
      balance('p2', -10_000),
      balance('p3', -10_000),
    ]

    expect(simplifyDebts(balances)).toEqual(simplifyDebts(balances))
    expect(simplifyDebts(balances)).toEqual([
      { fromId: 'p2', toId: 'p0', amount: 10_000 },
      { fromId: 'p3', toId: 'p1', amount: 10_000 },
    ])
  })

  describe('property', () => {
    it('송금을 모두 반영하면 전원 순액이 0이 된다', () => {
      fc.assert(
        fc.property(arbitraryBalancedNets(), (balances) => {
          const settled = new Map(balances.map((b) => [b.participantId, b.net]))
          for (const transfer of simplifyDebts(balances)) {
            settled.set(transfer.fromId, (settled.get(transfer.fromId) ?? 0) + transfer.amount)
            settled.set(transfer.toId, (settled.get(transfer.toId) ?? 0) - transfer.amount)
          }

          for (const net of settled.values()) expect(net).toBe(0)
        }),
      )
    })

    it('송금 건수는 참여자 수보다 적다', () => {
      fc.assert(
        fc.property(arbitraryBalancedNets(), (balances) => {
          expect(simplifyDebts(balances).length).toBeLessThanOrEqual(balances.length - 1)
        }),
      )
    })

    it('모든 송금 금액은 1원 이상의 정수다', () => {
      fc.assert(
        fc.property(arbitraryBalancedNets(), (balances) => {
          for (const transfer of simplifyDebts(balances)) {
            expect(Number.isInteger(transfer.amount)).toBe(true)
            expect(transfer.amount).toBeGreaterThan(0)
          }
        }),
      )
    })
  })
})
