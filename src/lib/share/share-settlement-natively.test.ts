import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Settlement } from '@/types/settlement';

import { shareSettlementNatively } from './share-settlement-natively';

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'p1',
  participants: [{ id: 'p1', name: '민수', headcount: 2 }],
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

const setNativeShare = (share: Navigator['share']) => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
};

describe('shareSettlementNatively', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share');
  });

  it('제목·총액·인원과 읽기 전용 링크를 시스템 공유 시트에 전달한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNativeShare(share);

    await expect(
      shareSettlementNatively(settlement, 'https://example.com/s#encoded'),
    ).resolves.toEqual({ status: 'shared' });
    expect(share).toHaveBeenCalledWith({
      title: '캠핑 정산',
      text: '총 10,000원 · 2명',
      url: 'https://example.com/s#encoded',
    });
  });

  it('사용자가 공유 시트를 닫으면 실패가 아닌 취소로 구분한다', async () => {
    setNativeShare(vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')));

    await expect(
      shareSettlementNatively(settlement, 'https://example.com/s#encoded'),
    ).resolves.toEqual({ status: 'cancelled' });
  });

  it('지원하지 않거나 공유 중 오류가 나면 폴백 가능한 실패를 돌려준다', async () => {
    await expect(
      shareSettlementNatively(settlement, 'https://example.com/s#encoded'),
    ).resolves.toEqual({ status: 'failed' });

    setNativeShare(vi.fn().mockRejectedValue(new Error('share failed')));
    await expect(
      shareSettlementNatively(settlement, 'https://example.com/s#encoded'),
    ).resolves.toEqual({ status: 'failed' });
  });
});
