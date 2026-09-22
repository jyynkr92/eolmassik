/** 참여자 이름 검사의 공개 계약. `validate-participant-name.ts` 참고. */

/** 이름이 거절된 이유. 문구는 화면마다 다를 수 있어 코드만 돌려준다. */
export type ParticipantNameError = 'empty' | 'duplicate';

export type ParticipantNameCheck =
  | { isValid: true; name: string }
  | { isValid: false; error: ParticipantNameError };
