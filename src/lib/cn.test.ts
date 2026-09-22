import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('클래스를 이어 붙인다', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('falsy 값을 무시한다', () => {
    expect(cn('px-2', false, undefined, null, '')).toBe('px-2');
  });

  it('조건부 클래스를 받는다', () => {
    const isActive = true;
    expect(cn('px-2', isActive && 'font-bold')).toBe('px-2 font-bold');
  });

  it('나중에 오는 Tailwind 클래스가 앞을 덮는다', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('디자인 토큰 색상 충돌도 해소한다', () => {
    expect(cn('bg-surface-base', 'bg-surface-dim')).toBe('bg-surface-dim');
    expect(cn('text-on-surface-base', 'text-on-surface-muted')).toBe('text-on-surface-muted');
    expect(cn('border-outline-base', 'border-outline-strong')).toBe('border-outline-strong');
  });

  it('충돌하지 않는 토큰 클래스는 함께 남긴다', () => {
    expect(cn('bg-surface-dim', 'text-on-surface-muted')).toBe(
      'bg-surface-dim text-on-surface-muted',
    );
  });
});
