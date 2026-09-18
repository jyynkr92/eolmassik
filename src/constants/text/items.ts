import { formatAmount } from '@/lib/format';

/** [3] 항목 입력. 기획설계 5.3 */
export const ITEMS_TEXT = {
  title: '항목',
  addAction: '항목 추가',

  nameLabel: '항목 이름',
  namePlaceholder: '고기, 바베큐장 이용료',
  amountLabel: '금액',
  removeAction: (name: string) => `${name === '' ? '이름 없는 항목' : name} 삭제`,

  empty: '함께 쓴 돈을 항목으로 넣어 주세요',
  /** 항목은 부담할 사람이 있어야 만들 수 있다. 결제자도 참여자 중에서 정해진다. */
  needsParticipants: '참여자를 먼저 추가해 주세요',

  /**
   * 행 아래에 붙는 상태 요약. 기획설계 5.3
   *
   * 기본값(전원이 똑같이 나눔)에서 벗어난 항목에만 붙인다. 모든 행에 "5명 N빵" 을 적으면
   * 열 줄 중 아홉 줄이 같은 말이라 정작 예외인 한 줄이 묻힌다. 조용한 행이 기본이고,
   * 뭔가 적혀 있으면 그게 곧 "여긴 예외" 라는 신호다.
   */
  summary: {
    noParticipants: '부담할 사람이 없어요',
    partial: (participantCount: number) => `${participantCount}명만 부담`,
    full: (name: string) => `${name} 전액`,
    amount: (name: string, value: number) => `${name} +${formatAmount(value)}`,
  },

  count: (total: number) => `${total}개`,
  totalLabel: '합계',
} as const;
