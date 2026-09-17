import type { Participant } from '@/types/settlement';

import type { ParticipantNameCheck } from './types';

/**
 * 비교용으로 이름을 다듬는다.
 *
 * 앞뒤 공백은 떼고 대소문자는 무시한다. "Alice" 와 "alice" 는 정산 결과에서 같은 사람으로
 * 읽히는데 서로 다른 참여자로 들어가면, 이름이 비슷한 줄이 두 개 생겨 누가 누구인지
 * 구분되지 않는다. 한글에는 대소문자가 없어 이 단계가 아무것도 바꾸지 않는다.
 */
const normalizeName = (name: string): string => name.trim().toLowerCase();

/**
 * 참여자 이름 입력을 검사한다. 추가하는 곳과 고치는 곳이 같은 규칙을 쓴다.
 *
 * 같은 이름을 막는 이유는 계산이 아니라 결과다. 계산은 id 로 하므로 이름이 겹쳐도 금액은
 * 맞지만, 결과 화면과 공유 텍스트에는 이름만 나온다. "민수" 가 둘이면 받는 사람이 누구에게
 * 보내야 하는지 알 수 없다.
 *
 * `excludeId` 는 이름을 고치는 중인 본인을 비교에서 뺄 때 쓴다. 빼지 않으면 이름을 그대로
 * 둔 채 인원만 바꾸려 해도 중복으로 걸린다.
 *
 * 통과하면 다듬은 이름을 함께 돌려준다. 호출부가 `trim()` 을 다시 부르지 않게 해, 검사한
 * 값과 저장하는 값이 어긋날 여지를 없앤다.
 */
export const validateParticipantName = (
  input: string,
  participants: Participant[],
  excludeId?: string,
): ParticipantNameCheck => {
  const name = input.trim();
  if (name === '') return { isValid: false, error: 'empty' };

  const normalized = normalizeName(name);
  const hasDuplicate = participants.some(
    (participant) => participant.id !== excludeId && normalizeName(participant.name) === normalized,
  );
  if (hasDuplicate) return { isValid: false, error: 'duplicate' };

  return { isValid: true, name };
};
