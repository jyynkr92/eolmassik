import { MAX_AMOUNT } from '@/constants/settlement';
import { formatWon } from '@/lib/format';

/** 화면 여러 곳에서 쓰는 공통 문구. 두 화면 이상에서 쓰는 것만 여기 둔다. */
export const COMMON_TEXT = {
  appName: '얼마씩',

  /** 아이콘만 있는 버튼의 스크린리더용 이름. */
  close: '닫기',
  remove: '삭제',
  edit: '수정',
  add: '추가',

  /** 금액 입력이 상한에서 잘렸을 때. 상한 값은 상수에서 가져와 문구와 어긋나지 않게 한다. */
  maxAmountReached: `최대 ${formatWon(MAX_AMOUNT)}`,
} as const;
