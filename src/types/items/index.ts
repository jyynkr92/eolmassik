/** 항목 요약의 공개 계약. `describe-item.ts` 참고. */

/**
 * 항목 행에 알릴 사실 하나.
 *
 * 문구가 아니라 판단만 담는다. "3명만 부담" 같은 표현은 `constants/text/items` 가 맡는다.
 * 결제자를 뺀 나머지는 기본값(참여자 전원이 추가 부담 없이 똑같이 나눔)에서 벗어날 때만
 * 만든다.
 */
export type ItemNotice =
  /** 결제자. 예외가 아니어도 항상 만든다. */
  | { kind: 'payer'; participantName: string }
  | { kind: 'no-payer' }
  /**
   * 부담자를 아무도 고르지 않아 결제자가 전액을 지는 상태. 기획설계 4.1
   * 누구인지는 바로 앞의 `payer` 가 말하므로 이름을 담지 않는다.
   */
  | { kind: 'payer-only' }
  | { kind: 'partial'; participantCount: number }
  | { kind: 'full-charge'; participantName: string }
  | { kind: 'amount-charge'; participantName: string; value: number };
