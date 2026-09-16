import { Check } from 'lucide-react';
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
 * 선택 상태를 색으로만 알리지 않는다. 색각 이상이 있으면 채움 색과 테두리 색의 차이를
 * 놓치므로, 선택되면 체크 아이콘이 함께 붙는다. 굵기를 바꾸는 방법도 있지만 칩이
 * 줄바꿈되며 늘어서는 자리라 테두리가 두꺼워질 때마다 줄 전체가 출렁인다.
 * `aria-pressed` 로 상태가 소리로도 전달된다.
 */
const Chip = ({ isSelected, suffix, type = 'button', className, children, ...props }: Props) => {
  return (
    <button
      type={type}
      aria-pressed={isSelected}
      className={cn(
        'focus-ring inline-flex h-10 items-center gap-2 rounded-full border-2 px-4 text-sm font-medium transition',
        'pointer-fine:active:scale-98',
        'disabled:pointer-events-none disabled:opacity-40',
        isSelected
          ? 'bg-accent-subtle text-accent-text border-accent-line'
          : 'bg-surface-raised text-on-surface-muted border-outline-base hover:bg-surface-dim pointer-fine:active:bg-surface-inset',
        className,
      )}
      {...props}
    >
      {isSelected && <Check size={16} strokeWidth={3} aria-hidden />}
      {children}
      {suffix}
    </button>
  );
};

export default Chip;
