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

  /** 시트를 확정하고 닫는 버튼. 바로 반영되는 걸 모르는 사람에게 끝나는 지점을 준다. */
  apply: '적용',
  cancel: '취소',
  /** 시트 안에서 확인 화면으로 들어갔다가 돌아오는 길. */
  back: '뒤로',
  /** 삭제는 되돌릴 수 없다. 확인 화면의 부제로 쓴다. */
  removeWarning: '되돌릴 수 없어요',

  /** 금액 입력이 상한에서 잘렸을 때. 상한 값은 상수에서 가져와 문구와 어긋나지 않게 한다. */
  maxAmountReached: `최대 ${formatWon(MAX_AMOUNT)}`,
} as const;
