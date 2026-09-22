import { describe, expect, it } from 'vitest';

import type { Settlement } from '@/types/settlement';

import { createSettlementShareUrl } from './create-settlement-share-url';

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'p1',
  participants: [{ id: 'p1', name: '민수', headcount: 1 }],
  items: [
    {
      id: 'i1',
      name: '고기',
      amount: 10_000,
      payerId: 'p1',
      participantIds: ['p1'],
      extraCharges: [],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

describe('createSettlementShareUrl', () => {
  it('현재 도메인의 /s fragment에만 정산 데이터를 넣는다', () => {
    const result = createSettlementShareUrl(settlement, 'https://eolmassik.vercel.app');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const url = new URL(result.data);
    expect(url.origin).toBe('https://eolmassik.vercel.app');
    expect(url.pathname).toBe('/s');
    expect(url.search).toBe('');
    expect(url.hash.length).toBeGreaterThan(1);
  });

  it('1,500자 이상인 링크는 단축 백엔드가 필요하다고 알린다', () => {
    const participants = Array.from({ length: 100 }, (_, index) => ({
      id: `p${index}`,
      name: `참여자-${index}-${'가'.repeat(80)}`,
      headcount: 1,
    }));
    const result = createSettlementShareUrl(
      {
        ...settlement,
        participants,
        defaultPayerId: participants[0]?.id ?? null,
        items: Array.from({ length: 100 }, (_, index) => ({
          id: `i${index}`,
          name: `항목-${index}-${'나'.repeat(80)}`,
          amount: 10_000,
          payerId: participants[index % participants.length]?.id ?? '',
          participantIds: participants.map(({ id }) => id),
          extraCharges: [],
        })),
      },
      'https://eolmassik.vercel.app',
    );

    expect(result).toEqual({ success: false, error: 'too-long' });
  });
});
