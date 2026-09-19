import { formatWon } from '@/lib/format';

/** [4] 결과. 기획설계 5.5 */
export const RESULT_TEXT = {
  title: '정산 결과',
  editAction: '수정하기',
  totalLabel: '전체 결제 금액',
  participantCount: (count: number) => `${count}명`,
  itemCount: (count: number) => `${count}개 항목`,
  transferTitle: '정산 결과',
  transfer: (from: string, to: string) => `${from} → ${to}`,
  noTransfer: '서로 보낼 돈이 없어요',
  roundingExcess: (amount: number) => `송금액 올림으로 ${formatWon(amount)}을 더 보내요`,
  balanceTitle: '결제 정리',
  paidLabel: '결제',
  owedLabel: '내 몫',
  detailTitle: '상세 항목',
  openDetail: '상세 보기',
  payer: (name: string) => `${name} 결제`,
  extraCharges: '설정한 추가 부담',
  fullCharge: (name: string) => `${name} 전액`,
  amountCharge: (name: string, amount: number) => `${name} ${formatWon(amount)}`,
  shares: '항목별 부담 금액',
  itemName: (name: string) => (name.trim() === '' ? '이름 없는 항목' : name),
} as const;
