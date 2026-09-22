import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settlement } from '@/types/settlement';

import { loadKakaoSdk } from './load-kakao-sdk';
import { shareSettlementToKakao } from './share-settlement-to-kakao';

vi.mock('./load-kakao-sdk', () => ({ loadKakaoSdk: vi.fn() }));

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

describe('shareSettlementToKakao', () => {
  beforeEach(() => vi.clearAllMocks());

  it('제목·총액·인원과 읽기 전용 링크를 피드 템플릿으로 공유한다', async () => {
    const sendDefault = vi.fn().mockResolvedValue(undefined);
    vi.mocked(loadKakaoSdk).mockResolvedValue({
      init: vi.fn(),
      isInitialized: vi.fn(() => true),
      Share: { sendDefault },
    });

    await expect(
      shareSettlementToKakao(settlement, 'https://example.com/s#encoded', 'key'),
    ).resolves.toEqual({ success: true });
    expect(sendDefault).toHaveBeenCalledWith({
      objectType: 'feed',
      content: {
        title: '캠핑 정산',
        description: '총 10,000원 · 2명',
        link: {
          mobileWebUrl: 'https://example.com/s#encoded',
          webUrl: 'https://example.com/s#encoded',
        },
      },
      buttons: [
        {
          title: '정산 내역 보기',
          link: {
            mobileWebUrl: 'https://example.com/s#encoded',
            webUrl: 'https://example.com/s#encoded',
          },
        },
      ],
    });
  });

  it('SDK 로드 실패를 호출부가 폴백할 수 있는 결과로 돌려준다', async () => {
    vi.mocked(loadKakaoSdk).mockRejectedValue(new Error('load failed'));

    await expect(
      shareSettlementToKakao(settlement, 'https://example.com/s#encoded', 'key'),
    ).resolves.toEqual({ success: false });
  });
});
