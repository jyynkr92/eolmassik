import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * 디자인 토큰 색상 목록. styles/theme.css 와 같은 이름을 유지한다.
 *
 * tailwind-merge 는 기본 팔레트만 알고 있어서, 토큰 클래스를 등록하지 않으면
 * `bg-surface-base bg-surface-dim` 같은 충돌을 해소하지 못하고 둘 다 남긴다.
 * 토큰을 추가하면 여기에도 함께 추가한다.
 */
const TOKEN_COLORS = [
  'surface-base',
  'surface-dim',
  'surface-raised',
  'surface-inset',
  'on-surface-base',
  'on-surface-muted',
  'on-surface-faint',
  'on-surface-inverse',
  'outline-base',
  'outline-strong',
  'accent-subtle',
  'accent-subtle-hover',
  'accent-line',
  'accent-base',
  'accent-solid',
  'accent-solid-hover',
  'accent-text',
  'accent-on',
  'danger-subtle',
  'danger-subtle-hover',
  'danger-line',
  'danger-base',
  'danger-solid',
  'danger-text',
  'danger-on',
  'credit-subtle',
  'credit-text',
  'debit-subtle',
  'debit-text',
  'focus-ring',
  'scrim',
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: TOKEN_COLORS,
    },
  },
});

/**
 * 조건부 클래스를 합치고, 뒤에 오는 Tailwind 클래스가 앞을 덮게 한다.
 *
 * ```ts
 * cn('px-2 py-1', isActive && 'bg-accent-base', className)
 * ```
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
