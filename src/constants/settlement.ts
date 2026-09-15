import type { Options } from '@/types/settlement'

/**
 * 기본 반올림 정책. 잔차는 결제자가 흡수한다.
 * 총대를 멘 사람이 1~4원을 감수하는 것이 사회적으로 자연스럽다. 기획설계 4.3
 */
export const DEFAULT_OPTIONS: Options = {
  rounding: 'none',
  roundingAbsorber: 'payer',
  fullChargeSplit: 'even',
}

/**
 * 이 길이를 넘으면 단축 URL 백엔드로 폴백한다. 기획설계 6.2
 * 카카오 공유 SDK 링크 길이 제한과 수신자의 심리적 저항을 함께 고려한 값이다.
 */
export const URL_FALLBACK_THRESHOLD = 1500
