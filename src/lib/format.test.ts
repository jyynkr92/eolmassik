import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { MAX_AMOUNT } from '@/constants/settlement';

import { formatAmount, formatWon, hasDigit, parseAmount } from './format';

describe('formatAmount', () => {
  it('세 자리마다 쉼표를 넣는다', () => {
    expect(formatAmount(0)).toBe('0');
    expect(formatAmount(1000)).toBe('1,000');
    expect(formatAmount(32000)).toBe('32,000');
  });

  it('음수 금액도 포맷한다', () => {
    expect(formatAmount(-14000)).toBe('-14,000');
  });

  it('어떤 정수를 넣어도 쉼표를 제거하면 원래 값으로 돌아온다', () => {
    fc.assert(
      fc.property(fc.integer(), (won) => {
        expect(Number(formatAmount(won).replaceAll(',', ''))).toBe(won);
      }),
    );
  });
});

describe('formatWon', () => {
  it('원 단위를 붙인다', () => {
    expect(formatWon(14000)).toBe('14,000원');
  });
});

describe('parseAmount', () => {
  it('숫자만 남기고 정수로 바꾼다', () => {
    expect(parseAmount('32,000')).toBe(32000);
    expect(parseAmount('32000원')).toBe(32000);
    expect(parseAmount(' 32 000 ')).toBe(32000);
  });

  it('빈 문자열과 숫자가 없는 입력은 0 이다', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('원')).toBe(0);
    expect(parseAmount('-')).toBe(0);
  });

  it('상한을 넘으면 상한으로 자른다', () => {
    expect(parseAmount('9999999999')).toBe(MAX_AMOUNT);
  });

  it('어떤 입력이든 0 이상 MAX_AMOUNT 이하의 정수를 돌려준다', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const amount = parseAmount(input);

        expect(Number.isInteger(amount)).toBe(true);
        expect(amount).toBeGreaterThanOrEqual(0);
        expect(amount).toBeLessThanOrEqual(MAX_AMOUNT);
      }),
    );
  });

  it('포맷한 금액을 되돌리면 원래 값이다', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAX_AMOUNT }), (won) => {
        expect(parseAmount(formatAmount(won))).toBe(won);
      }),
    );
  });
});

describe('hasDigit', () => {
  it('숫자가 하나라도 있으면 참이다', () => {
    expect(hasDigit('0')).toBe(true);
    expect(hasDigit('32,000원')).toBe(true);
  });

  it('숫자가 없으면 거짓이다', () => {
    expect(hasDigit('')).toBe(false);
    expect(hasDigit('원')).toBe(false);
  });

  it('여러 번 불러도 같은 답을 준다', () => {
    // 정규식에 g 플래그가 섞이면 lastIndex 가 남아 두 번째 호출부터 결과가 뒤집힌다
    expect(hasDigit('1')).toBe(true);
    expect(hasDigit('1')).toBe(true);
  });
});
