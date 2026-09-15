import type { Settlement } from '@/types/settlement';

import { calculateItem } from './calculate-item';
import { roundTransfers } from './round-transfers';
import { simplifyDebts } from './simplify-debts';
import type { ParticipantBalance, SettlementResult } from './types';

/**
 * 정산 전체를 계산한다. 기획설계 4.1 / 4.2
 *
 * 항목별 부담액을 모두 구한 뒤 참여자별로 "결제한 금액 - 부담할 금액" 을 내고,
 * 그 순액에서 송금 내역을 뽑는다. 계산 결과는 스토어에 두지 않고 매번 여기서 파생시킨다.
 *
 * 반올림은 마지막 송금 금액에만 적용한다. 부담액 계산은 항상 1원 단위로 정확하다.
 * 결제자가 참여자 목록에 없는 항목은 정산에서 빼고 `invalidItemIds` 로 알린다.
 */
export const calculateSettlement = (settlement: Settlement): SettlementResult => {
  const { participants, items, options } = settlement;
  const participantIds = new Set(participants.map((participant) => participant.id));

  // 결제자가 참여자 목록에 없는 항목은 결제액과 부담액 어느 쪽도 집계하지 않는다.
  // 한쪽만 빼면 보낼 곳 없는 빚이 남고 순액 합이 어긋난다. 대신 id 를 돌려준다.
  const payableItems = items.filter((item) => participantIds.has(item.payerId));
  const invalidItemIds = items
    .filter((item) => !participantIds.has(item.payerId))
    .map((item) => item.id);

  const itemResults = payableItems.map((item) => calculateItem(item, participants, options));

  const paidById = new Map<string, number>();
  const owedById = new Map<string, number>();

  for (const item of payableItems) {
    paidById.set(item.payerId, (paidById.get(item.payerId) ?? 0) + Math.max(0, item.amount));
  }

  for (const itemResult of itemResults) {
    for (const share of itemResult.shares) {
      owedById.set(share.participantId, (owedById.get(share.participantId) ?? 0) + share.amount);
    }
  }

  const balances: ParticipantBalance[] = participants.map((participant) => {
    const paid = paidById.get(participant.id) ?? 0;
    const owed = owedById.get(participant.id) ?? 0;
    return { participantId: participant.id, paid, owed, net: paid - owed };
  });

  const { transfers, excess } = roundTransfers(simplifyDebts(balances), options.rounding);

  return {
    itemResults,
    invalidItemIds,
    balances,
    transfers,
    roundingExcess: excess,
    totalAmount: payableItems.reduce((acc, item) => acc + Math.max(0, item.amount), 0),
  };
};
