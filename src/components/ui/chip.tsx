import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 눌린 상태. 넘기면 `aria-pressed` 가 함께 붙어 토글 버튼으로 읽힌다.
   * 토글이 아닌 그냥 누르는 칩이면 비워 둔다.
   */
  isSelected?: boolean;
  /** 이름 오른쪽 보조 정보. 인원수 뱃지처럼 쓴다. */
  suffix?: ReactNode;
  children: ReactNode;
}

/**
 * 참여자 칩. 기획설계 5.2
 *
 * 선택 상태를 색으로만 알리지 않는다. 색각 이상이 있으면 채움 색의 차이를 놓치므로
 * 테두리 굵기도 함께 바뀌고, `aria-pressed` 로 상태가 소리로도 전달된다.
 */
const Chip = ({ isSelected, suffix, type = 'button', className, children, ...props }: Props) => {
  return (
    <button
      type={type}
      aria-pressed={isSelected}
      className={cn(
        'focus-ring inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
        'pointer-fine:active:scale-98',
        'disabled:pointer-events-none disabled:opacity-40',
        isSelected
          ? 'bg-accent-subtle text-accent-text border-accent-line border-2'
          : 'bg-surface-raised text-on-surface-muted border-outline-base hover:bg-surface-dim pointer-fine:active:bg-surface-inset border-2',
        className,
      )}
      {...props}
    >
      {children}
      {suffix}
    </button>
  );
};

export default Chip;
