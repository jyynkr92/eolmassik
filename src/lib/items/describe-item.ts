import type { Item, Participant } from '@/types/settlement';

import { hasPayer } from './has-payer';
import type { ItemNotice } from './types';

/**
 * 항목 행에 알릴 사실들을 추린다. 기획설계 5.3
 *
 * 기본값에서 벗어난 것만 담는다. 전원이 추가 부담 없이 똑같이 나누는 항목은 빈 배열이라
 * 행에 아무것도 그리지 않는다. 모든 행에 "5명 N빵" 을 적으면 열 줄 중 아홉 줄이 같은 말이라
 * 정작 예외인 한 줄이 묻힌다.
 *
 * 금액 계산은 하지 않는다. 행은 훑어보는 자리고, 정확한 부담액은 결과 화면이 맡는다.
 *
 * 참여자 목록에 없는 id 는 버린다. 공유 URL 로 들어온 데이터에는 이미 지워진 참여자를
 * 가리키는 값이 남아 있을 수 있는데, 이름을 못 찾았다고 화면이 비면 안 된다.
 */
export const describeItem = (item: Item, participants: Participant[]): ItemNotice[] => {
  const nameById = new Map(participants.map((participant) => [participant.id, participant.name]));
  const notices: ItemNotice[] = [];

  // 결제자가 없으면 이 항목은 정산에서 빠진다. 가장 먼저 알린다
  if (!hasPayer(item, participants)) notices.push({ kind: 'no-payer' });

  // Set 으로 센다. 조작된 데이터에 같은 id 가 두 번 들어 있으면 부담자가 참여자보다 많아지고,
  // 그러면 일부만 부담하는 항목이 전원 부담으로 보인다
  const participantCount = new Set(item.participantIds.filter((id) => nameById.has(id))).size;

  if (participantCount === 0) notices.push({ kind: 'no-participants' });
  else if (participantCount < participants.length)
    notices.push({ kind: 'partial', participantCount });

  for (const charge of item.extraCharges) {
    const participantName = nameById.get(charge.participantId);
    if (participantName === undefined) continue;

    if (charge.type === 'full') {
      notices.push({ kind: 'full-charge', participantName });
      continue;
    }

    // 금액 지정인데 값이 없으면 보여줄 게 없다. 0원 부담은 부담이 아니다
    if (charge.value === undefined || charge.value <= 0) continue;

    notices.push({ kind: 'amount-charge', participantName, value: charge.value });
  }

  return notices;
};
