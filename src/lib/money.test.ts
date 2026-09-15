import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { formatAmount, formatWon } from './money'

describe('formatAmount', () => {
  it('세 자리마다 쉼표를 넣는다', () => {
    expect(formatAmount(0)).toBe('0')
    expect(formatAmount(1000)).toBe('1,000')
    expect(formatAmount(32000)).toBe('32,000')
  })

  it('음수 금액도 포맷한다', () => {
    expect(formatAmount(-14000)).toBe('-14,000')
  })

  it('어떤 정수를 넣어도 쉼표를 제거하면 원래 값으로 돌아온다', () => {
    fc.assert(
      fc.property(fc.integer(), (won) => {
        expect(Number(formatAmount(won).replaceAll(',', ''))).toBe(won)
      }),
    )
  })
})

describe('formatWon', () => {
  it('원 단위를 붙인다', () => {
    expect(formatWon(14000)).toBe('14,000원')
  })
})
