import type { ParticipantBalance, Transfer } from './types'

/** 전역 DOM `Node` 와 이름이 겹치지 않게 접두어를 붙인다. */
type DebtNode = {
  id: string
  amount: number
}

const toSortedNodes = (balances: ParticipantBalance[], sign: 1 | -1): DebtNode[] =>
  balances
    .filter((balance) => balance.net * sign > 0)
    .map((balance) => ({ id: balance.participantId, amount: balance.net * sign }))
    .sort((a, b) => b.amount - a.amount)

/**
 * 순액에서 송금 내역을 만든다. 기획설계 4.2
 *
 * 채권자와 채무자를 금액 큰 순으로 세워 그리디하게 매칭한다. 6명이면 15건까지
 * 나올 수 있는 송금을 최대 (참여자 수 - 1)건으로 압축한다.
 * 금액이 같으면 `Array.prototype.sort` 가 안정 정렬이라 `balances` 순서로 갈린다.
 * 같은 입력이면 항상 같은 결과가 나온다.
 */
export const simplifyDebts = (balances: ParticipantBalance[]): Transfer[] => {
  const creditors = toSortedNodes(balances, 1)
  const debtors = toSortedNodes(balances, -1)

  const transfers: Transfer[] = []
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    if (!creditor || !debtor) break

    // 양쪽 다 0보다 큰 금액만 들어오므로 실제로는 걸리지 않는다. 무한 루프 방지용 안전핀이다.
    const amount = Math.min(creditor.amount, debtor.amount)
    if (amount <= 0) break

    transfers.push({ fromId: debtor.id, toId: creditor.id, amount })
    creditor.amount -= amount
    debtor.amount -= amount
    if (creditor.amount === 0) creditorIndex += 1
    if (debtor.amount === 0) debtorIndex += 1
  }

  return transfers
}
