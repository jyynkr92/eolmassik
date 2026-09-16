/** 표시용 포맷 유틸. 모든 금액은 정수 원 단위다. */

import { MAX_AMOUNT } from '@/constants/settlement';

const amountFormatter = new Intl.NumberFormat('ko-KR');

/** 숫자 한 글자. `g` 플래그를 쓰지 않는다. `lastIndex` 가 남아 호출마다 결과가 달라진다. */
const DIGIT_PATTERN = /\d/;
const NON_DIGIT_PATTERN = /\D/g;

/** 32000 → "32,000" */
export const formatAmount = (won: number): string => amountFormatter.format(won);

/** 32000 → "32,000원" */
export const formatWon = (won: number): string => `${amountFormatter.format(won)}원`;

/**
 * 금액 입력 문자열을 정수 원으로 바꾼다.
 *
 * 입력칸에는 쉼표가 섞인 문자열("32,000")이 들어오고, 모바일 키보드에서는 공백이나
 * 통화 기호가 딸려 들어오기도 한다. 숫자가 아닌 문자를 전부 버리는 쪽이 부분적으로
 * 해석하는 것보다 예측 가능하다.
 *
 * `Number('')` 가 0 이 아니라 NaN 으로 새는 일이 없도록 빈 문자열을 먼저 걸러낸다.
 * 여기서 새면 금액이 `NaN` 이 되어 총액과 모든 송금액으로 번진다.
 */
export const parseAmount = (input: string): number => {
  const digits = input.replace(NON_DIGIT_PATTERN, '');
  if (digits === '') return 0;

  return Math.min(Number(digits), MAX_AMOUNT);
};

/** 문자열에 숫자가 하나라도 들어 있는지. */
export const hasDigit = (input: string): boolean => DIGIT_PATTERN.test(input);
