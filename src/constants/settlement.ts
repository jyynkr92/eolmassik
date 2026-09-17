import type { Options, Rounding } from '@/types/settlement';

/**
 * 기본 반올림 정책. 잔차는 결제자가 흡수한다.
 * 총대를 멘 사람이 1~4원을 감수하는 것이 사회적으로 자연스럽다. 기획설계 4.3
 */
export const DEFAULT_OPTIONS: Options = {
  rounding: 'none',
  roundingAbsorber: 'payer',
  fullChargeSplit: 'even',
};

/**
 * 이 길이를 넘으면 단축 URL 백엔드로 폴백한다. 기획설계 6.2
 * 카카오 공유 SDK 링크 길이 제한과 수신자의 심리적 저항을 함께 고려한 값이다.
 */
export const URL_FALLBACK_THRESHOLD = 1500;

/**
 * 반올림 단위. `none` 은 1원 단위라 올림이 아무것도 바꾸지 않는다. 기획설계 4.3
 * 항목별 부담액이 아니라 송금 금액에만 적용한다. `lib/calc/round-transfers.ts`
 */
export const ROUNDING_UNIT: Record<Rounding, number> = {
  none: 1,
  ceil10: 10,
  ceil100: 100,
};

/**
 * 금액 입력칸이 받는 최댓값. 1원 미만과 이 값을 넘는 입력은 만들 수 없다.
 *
 * 상한을 두는 이유는 두 가지다. 자릿수가 커지면 좁은 화면에서 행 레이아웃이 무너지고,
 * 오타(0 을 한 번 더 누름)를 금액 합계가 이상해진 뒤에야 알아채게 된다.
 * 1조 원을 N빵 하는 상황은 이 앱의 대상이 아니다.
 */
export const MAX_AMOUNT = 999_999_999;

/**
 * 참여자 한 명이 가질 수 있는 최대 인원수.
 *
 * "은정이네" 처럼 한 참여자가 여러 명을 대표할 때 쓴다. 상세 시트의 ⊖ / ⊕ 가 1 과 이 값
 * 사이에서만 움직이고 경계에서 멈춘다.
 * 한 참여자가 10인분을 부담하는 상황은 이 앱의 대상이 아니다. 기획설계 3.2
 */
export const MAX_HEADCOUNT = 9;
