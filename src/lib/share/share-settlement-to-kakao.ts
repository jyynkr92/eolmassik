import { SHARE_TEXT } from '@/constants/text/share';
import { calculateSettlement } from '@/lib/calc';
import type { Settlement } from '@/types/settlement';

import { loadKakaoSdk } from './load-kakao-sdk';

type KakaoShareResult = { success: true } | { success: false };

/** 카카오 기본 피드 템플릿으로 읽기 전용 정산 링크를 공유한다. */
export const shareSettlementToKakao = async (
  settlement: Settlement,
  shareUrl: string,
  javascriptKey: string,
): Promise<KakaoShareResult> => {
  try {
    const sdk = await loadKakaoSdk(javascriptKey);
    const result = calculateSettlement(settlement);
    const totalHeadcount = settlement.participants.reduce(
      (sum, participant) => sum + participant.headcount,
      0,
    );

    await sdk.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: settlement.title.trim() || SHARE_TEXT.defaultTitle,
        description: SHARE_TEXT.summary(result.totalAmount, totalHeadcount),
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: SHARE_TEXT.kakaoViewAction,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    });
    return { success: true };
  } catch {
    return { success: false };
  }
};
