/** [1] 홈 / 정산 시작. 기획설계 5.1 */
export const HOME_TEXT = {
  tagline: '가입 없이 링크 하나로 끝내는 1/N 정산',
  submitSectionLabel: '정산 결과 확인',
  submitAction: '결과 보기',
  needsItem: '항목을 추가하면 결과를 볼 수 있어요',
  invalidItems: (count: number) => `결제자가 없는 항목 ${count}개의 결제자를 먼저 지정해 주세요`,
} as const;
