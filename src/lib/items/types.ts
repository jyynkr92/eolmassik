/** 항목 요약의 공개 계약. `summarize-item.ts` 참고. */

/** 한 사람에게 걸린 추가 부담. 기획설계 3.4 */
export type ItemSummaryCharge =
  | { participantName: string; type: 'full' }
  | { participantName: string; type: 'amount'; value: number };

/**
 * 행에 한 줄로 붙는 상태 요약.
 *
 * 문구가 아니라 판단만 담는다. "5명 N빵" 같은 표현은 `constants/text/items` 가 맡는다.
 */
export type ItemSummary = {
  /** 이 항목을 부담하는 사람 수. */
  participantCount: number;
  /** 추가 부담이 걸린 사람들. 없으면 빈 배열이다. */
  charges: ItemSummaryCharge[];
};
