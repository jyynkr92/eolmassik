import type { Item, Participant } from '@/types/settlement';

import type { ItemSummary, ItemSummaryCharge } from './types';

/**
 * 항목 행에 붙는 상태 요약을 만든다. 기획설계 5.3
 *
 * 부담자 수와 추가 부담만 추린다. 금액 계산은 하지 않는다. 행은 훑어보는 자리고,
 * 정확한 부담액은 결과 화면이 맡는다.
 *
 * 참여자 목록에 없는 id 는 버린다. 공유 URL 로 들어온 데이터에는 이미 지워진 참여자를
 * 가리키는 추가 부담이 남아 있을 수 있는데, 이름을 못 찾았다고 화면이 비면 안 된다.
 */
export const summarizeItem = (item: Item, participants: Participant[]): ItemSummary => {
  const nameById = new Map(participants.map((participant) => [participant.id, participant.name]));

  const participantCount = item.participantIds.filter((id) => nameById.has(id)).length;

  const charges = item.extraCharges.flatMap<ItemSummaryCharge>((charge) => {
    const participantName = nameById.get(charge.participantId);
    if (participantName === undefined) return [];

    if (charge.type === 'full') return [{ participantName, type: 'full' }];

    // 금액 지정인데 값이 없으면 보여줄 게 없다. 0원 부담은 부담이 아니다
    if (charge.value === undefined || charge.value <= 0) return [];

    return [{ participantName, type: 'amount', value: charge.value }];
  });

  return { participantCount, charges };
};
