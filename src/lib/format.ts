/** 표시용 포맷 유틸. 모든 금액은 정수 원 단위다. */

const amountFormatter = new Intl.NumberFormat('ko-KR')

/** 32000 → "32,000" */
export const formatAmount = (won: number): string => amountFormatter.format(won)

/** 32000 → "32,000원" */
export const formatWon = (won: number): string => `${amountFormatter.format(won)}원`
