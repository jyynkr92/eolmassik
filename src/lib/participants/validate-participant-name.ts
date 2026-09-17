import type { Participant } from '@/types/settlement';

import type { ParticipantNameCheck } from './types';

/** 연속 공백. `replace` 는 호출마다 `lastIndex` 를 되돌리므로 `g` 를 써도 안전하다. */
const CONSECUTIVE_SPACE_PATTERN = /\s+/g;

/**
 * 저장과 비교에 공통으로 쓰는 정리.
 *
 * `normalize('NFC')` 가 필요한 이유는 한글에 표현이 둘이기 때문이다. 같은 "민수" 라도
 * 완성형(NFC)과 조합형(NFD)은 코드포인트가 달라 `===` 비교가 어긋난다. macOS 에서
 * 복사해 오거나 일부 IME 를 거치면 조합형이 들어오는데, 그대로 두면 눈으로 똑같은 이름
 * 두 개가 중복 검사를 통과한다.
 *
 * 연속 공백도 하나로 줄인다. "김 민수" 와 "김  민수" 가 결과 화면에서 구분되지 않는데
 * 다른 참여자로 들어가면 앞뒤 공백을 떼는 것만으로는 부족하다.
 */
const cleanName = (name: string): string =>
  name.trim().normalize('NFC').replace(CONSECUTIVE_SPACE_PATTERN, ' ');

/** 비교용. 대소문자까지 무시한다. 한글에는 대소문자가 없어 이 단계가 아무것도 바꾸지 않는다. */
const normalizeName = (name: string): string => cleanName(name).toLowerCase();

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
 * 통과하면 정리한 이름을 함께 돌려준다. 호출부가 다시 다듬지 않게 해, 검사한 값과 저장하는
 * 값이 어긋날 여지를 없앤다.
 */
export const validateParticipantName = (
  input: string,
  participants: Participant[],
  excludeId?: string,
): ParticipantNameCheck => {
  const name = cleanName(input);
  if (name === '') return { isValid: false, error: 'empty' };

  // name 은 이미 cleanName 을 거쳤다. 대소문자만 맞추면 비교 형태가 된다
  const normalized = name.toLowerCase();
  const hasDuplicate = participants.some(
    (participant) => participant.id !== excludeId && normalizeName(participant.name) === normalized,
  );
  if (hasDuplicate) return { isValid: false, error: 'duplicate' };

  return { isValid: true, name };
};
