import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'danger' | 'danger-solid';
type ButtonSize = 'md' | 'lg';

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

interface LabelledProps extends BaseProps {
  isIconOnly?: false;
  isFullWidth?: boolean;
  /** 라벨 왼쪽 아이콘. lucide 아이콘을 `<Plus size={18} aria-hidden />` 형태로 넘긴다. */
  leadingIcon?: ReactNode;
}

interface IconOnlyProps extends BaseProps {
  isIconOnly: true;
  /**
   * 아이콘만 있는 버튼은 읽을 글자가 없어서, 이게 없으면 스크린리더가 "버튼"이라고만
   * 읽는다. 선택이 아니라 필수로 둔 이유다.
   */
  'aria-label': string;
  isFullWidth?: never;
  leadingIcon?: never;
}

type Props = LabelledProps | IconOnlyProps;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  solid: 'bg-accent-solid text-accent-on hover:bg-accent-solid-hover',
  soft: 'bg-accent-subtle text-accent-text hover:bg-accent-subtle-hover',
  outline:
    'border-outline-strong bg-surface-raised text-on-surface-base hover:bg-surface-dim pointer-fine:active:bg-surface-inset border',
  ghost:
    'text-on-surface-muted hover:bg-surface-dim hover:text-on-surface-base pointer-fine:active:bg-surface-inset',
  danger: 'bg-danger-subtle text-danger-text hover:bg-danger-subtle-hover',
  // 되돌릴 수 없는 동작의 확인 버튼. 평소에는 soft 인 danger 를 쓴다
  'danger-solid': 'bg-danger-solid text-danger-on hover:bg-danger-base',
};

/** 높이는 손가락으로 누를 수 있는 크기에서 시작한다. `md` 40px, `lg` 48px. */
const SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

/**
 * 아이콘만 있으면 정사각형이다. `md` 도 44px 로 둔다. (WCAG 2.5.5)
 *
 * `tap-target` 으로 40px 버튼에 44px 오버레이를 씌우는 방법도 있지만, 오버레이가
 * 사방 2px 씩 버튼 밖으로 나가 옆에 붙은 요소의 가장자리 클릭을 가로챈다.
 * 눌리는 영역과 보이는 영역을 같게 두는 쪽이 예측 가능하다.
 */
const ICON_ONLY_SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'size-11',
  lg: 'size-12',
};

/**
 * 기본 버튼.
 *
 * 아이콘만 있는 버튼도 여기서 처리한다(`isIconOnly`). 별도 컴포넌트로 나눴다가 합쳤다.
 * 나눌 근거가 "이름을 강제한다" 하나뿐이었는데, 그건 타입으로 되는 일이라 파일을
 * 늘릴 이유가 아니었다. `isIconOnly` 를 켜면 `aria-label` 이 필수가 되고,
 * `isFullWidth` 와 `leadingIcon` 은 쓸 수 없게 막힌다.
 *
 * `type` 기본값을 `button` 으로 둔다. HTML 기본값인 `submit` 이면 폼 안에 놓인 순간
 * 삭제·펼치기 같은 버튼이 폼을 제출해 버린다.
 */
const Button = ({
  variant = 'solid',
  size = 'md',
  isIconOnly = false,
  isFullWidth = false,
  leadingIcon,
  type = 'button',
  className,
  children,
  ...props
}: Props) => {
  return (
    <button
      type={type}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center font-semibold transition',
        // 눌린 느낌은 마우스 기기에서만 준다. globals.css 의 pointer-fine 설명 참고
        'pointer-fine:active:scale-98 disabled:pointer-events-none disabled:opacity-40',
        isIconOnly ? ICON_ONLY_SIZE_CLASS[size] : SIZE_CLASS[size],
        isIconOnly ? 'rounded-lg' : 'rounded-xl',
        VARIANT_CLASS[variant],
        isFullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
};

export default Button;
