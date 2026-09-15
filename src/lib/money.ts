/** 금액 표시 유틸. 모든 금액은 정수 원 단위다. */

const formatter = new Intl.NumberFormat('ko-KR')

/** 32000 → "32,000" */
export function formatAmount(won: number): string {
  return formatter.format(won)
}

/** 32000 → "32,000원" */
export function formatWon(won: number): string {
  return `${formatter.format(won)}원`
}
