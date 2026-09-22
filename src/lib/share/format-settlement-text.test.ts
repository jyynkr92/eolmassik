import { describe, expect, it } from 'vitest';

import { calculateSettlement } from '@/lib/calc';
import type { Settlement } from '@/types/settlement';

import { formatSettlementText } from './format-settlement-text';

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'minsu',
  participants: [
    { id: 'minsu', name: '민수', headcount: 1 },
    { id: 'eunjeong', name: '은정', headcount: 1 },
  ],
  items: [
    {
      id: 'meat',
      name: '고기',
      amount: 32_000,
      payerId: 'minsu',
      participantIds: ['minsu', 'eunjeong'],
      extraCharges: [{ participantId: 'minsu', type: 'amount', value: 12_000 }],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

describe('formatSettlementText', () => {
  it('총액, 항목별 실제 부담액, 최종 송금을 줄맞춤 없이 나열한다', () => {
    expect(formatSettlementText(settlement, calculateSettlement(settlement))).toBe(
      [
        '🧾 캠핑 정산 · 총 32,000원',
        '',
        '· 고기 32,000원 (민수 결제)',
        '부담: 민수 22,000원 · 은정 10,000원',
        '',
        '💸 정산',
        '은정 → 민수 10,000원',
      ].join('\n'),
    );
  });

  it('송금이 없으면 안내를 포함한다', () => {
    const participant = settlement.participants[0];
    const item = settlement.items[0];
    if (!participant || !item) throw new Error('테스트 정산 항목이 없습니다');

    const singleParticipant = {
      ...settlement,
      participants: [participant],
      items: [{ ...item, participantIds: ['minsu'], extraCharges: [] }],
    };

    expect(
      formatSettlementText(singleParticipant, calculateSettlement(singleParticipant)),
    ).toContain('💸 정산\n서로 보낼 돈이 없어요');
  });

  it('송금액 올림으로 생긴 초과분을 함께 알린다', () => {
    const item = settlement.items[0];
    if (!item) throw new Error('테스트 정산 항목이 없습니다');

    const rounded = {
      ...settlement,
      items: [{ ...item, amount: 31_998, extraCharges: [] }],
      options: { ...settlement.options, rounding: 'ceil100' as const },
    };

    expect(formatSettlementText(rounded, calculateSettlement(rounded))).toContain(
      '송금액 올림으로 1원을 더 보내요',
    );
  });
});
