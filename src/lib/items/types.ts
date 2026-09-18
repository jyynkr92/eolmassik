/** 항목 요약의 공개 계약. `describe-item.ts` 참고. */

/**
 * 항목 행에 알릴 사실 하나.
 *
 * 문구가 아니라 판단만 담는다. "3명만 부담" 같은 표현은 `constants/text/items` 가 맡는다.
 * 기본값(참여자 전원이 추가 부담 없이 똑같이 나눔)이면 아무것도 만들지 않는다.
 */
export type ItemNotice =
  | { kind: 'no-payer' }
  | { kind: 'no-participants' }
  | { kind: 'partial'; participantCount: number }
  | { kind: 'full-charge'; participantName: string }
  | { kind: 'amount-charge'; participantName: string; value: number };
