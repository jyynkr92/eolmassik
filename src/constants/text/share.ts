import { formatWon } from '@/lib/format';

/** [5] 공유받은 결과 (읽기 전용). 기획설계 5.6 */
export const SHARE_TEXT = {
  defaultTitle: '정산 결과',
  summary: (totalAmount: number, totalHeadcount: number) =>
    `총 ${formatWon(totalAmount)} · ${totalHeadcount}명`,
  kakaoViewAction: '정산 내역 보기',
  title: '공유받은 정산',
  description: '공유 링크에 담긴 읽기 전용 정산이에요',
  invalidTitle: '정산 링크를 열 수 없어요',
  invalidDescription: '링크가 손상되었거나 올바른 정산 데이터가 아니에요',
  unsupportedDescription: '더 새로운 버전에서 만든 링크예요. 얼마씩을 최신 버전으로 열어 주세요',
  emptyDescription: '공유 링크에 정산 데이터가 없어요',
  homeAction: '새 정산 만들기',
} as const;
