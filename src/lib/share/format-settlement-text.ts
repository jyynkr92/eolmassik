import { RESULT_TEXT } from '@/constants/text/result';
import type { SettlementResult } from '@/lib/calc/types';
import { formatWon } from '@/lib/format';
import type { Settlement } from '@/types/settlement';

/** 카톡 대화창에 그대로 붙여넣을 수 있는 정산 요약. 기획설계 6.1 */
export const formatSettlementText = (settlement: Settlement, result: SettlementResult): string => {
  const nameById = new Map(
    settlement.participants.map((participant) => [participant.id, participant.name]),
  );
  const itemById = new Map(settlement.items.map((item) => [item.id, item]));
  const lines = [
    RESULT_TEXT.copyHeading(settlement.title.trim() || RESULT_TEXT.title, result.totalAmount),
    '',
  ];

  for (const itemResult of result.itemResults) {
    const item = itemById.get(itemResult.itemId);
    if (!item) continue;

    lines.push(
      RESULT_TEXT.copyItem(
        RESULT_TEXT.itemName(item.name),
        item.amount,
        nameById.get(item.payerId) ?? '',
      ),
    );
    lines.push(
      RESULT_TEXT.copyShares(
        itemResult.shares
          .map((share) => `${nameById.get(share.participantId) ?? ''} ${formatWon(share.amount)}`)
          .join(' · '),
      ),
    );
  }

  lines.push('', RESULT_TEXT.copyTransferHeading);
  if (result.transfers.length === 0) {
    lines.push(RESULT_TEXT.noTransfer);
  } else {
    lines.push(
      ...result.transfers.map((transfer) =>
        RESULT_TEXT.copyTransfer(
          nameById.get(transfer.fromId) ?? '',
          nameById.get(transfer.toId) ?? '',
          transfer.amount,
        ),
      ),
    );
  }

  if (result.roundingExcess > 0) {
    lines.push(RESULT_TEXT.roundingExcess(result.roundingExcess));
  }

  return lines.join('\n');
};
