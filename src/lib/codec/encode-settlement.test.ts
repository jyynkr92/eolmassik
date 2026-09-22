import { describe, expect, it } from 'vitest';

import type { Settlement } from '@/types/settlement';

import { decodeSettlement } from './decode-settlement';
import { encodeSettlement } from './encode-settlement';

const settlement: Settlement = {
  id: 'settlement-id',
  title: '캠핑 정산',
  createdAt: 1_700_000_000_000,
  defaultPayerId: 'eunjeong',
  participants: [
    { id: 'eunjeong', name: '은정이네', headcount: 2 },
    { id: 'minsu', name: '민수', headcount: 1 },
  ],
  items: [
    {
      id: 'meat',
      name: '고기',
      amount: 32_000,
      payerId: 'eunjeong',
      participantIds: ['eunjeong', 'minsu'],
      extraCharges: [{ participantId: 'eunjeong', type: 'amount', value: 12_000 }],
    },
    {
      id: 'place',
      name: '바베큐장',
      amount: 25_000,
      payerId: 'minsu',
      participantIds: ['eunjeong', 'minsu'],
      extraCharges: [{ participantId: 'eunjeong', type: 'full' }],
    },
  ],
  options: { rounding: 'ceil100', roundingAbsorber: 'split', fullChargeSplit: 'headcount' },
};

describe('encodeSettlement', () => {
  it('정산을 URL-safe 문자열로 압축하고 의미가 같은 데이터로 복원한다', () => {
    const encoded = encodeSettlement(settlement);
    expect(encoded.success).toBe(true);
    if (!encoded.success) return;

    expect(encoded.data).toMatch(/^[A-Za-z0-9_-]+$/u);
    const decoded = decodeSettlement(encoded.data);
    expect(decoded.success).toBe(true);
    if (!decoded.success) return;

    expect(decoded.data).toMatchObject({
      title: settlement.title,
      createdAt: settlement.createdAt,
      options: settlement.options,
    });
    expect(decoded.data.participants.map(({ name, headcount }) => ({ name, headcount }))).toEqual(
      settlement.participants.map(({ name, headcount }) => ({ name, headcount })),
    );
    expect(decoded.data.items.map(({ id: _id, ...item }) => item)).toEqual([
      {
        name: '고기',
        amount: 32_000,
        payerId: 'p0',
        participantIds: ['p0', 'p1'],
        extraCharges: [{ participantId: 'p0', type: 'amount', value: 12_000 }],
      },
      {
        name: '바베큐장',
        amount: 25_000,
        payerId: 'p1',
        participantIds: ['p0', 'p1'],
        extraCharges: [{ participantId: 'p0', type: 'full' }],
      },
    ]);
    expect(decoded.data.defaultPayerId).toBe('p0');
  });

  it('존재하지 않는 참여자를 참조하면 실패를 타입으로 돌려준다', () => {
    const item = settlement.items[0];
    if (!item) throw new Error('테스트 정산 항목이 없습니다');
    const encoded = encodeSettlement({
      ...settlement,
      items: [{ ...item, payerId: 'missing' }],
    });

    expect(encoded).toEqual({ success: false, error: { code: 'invalid-settlement' } });
  });
});
