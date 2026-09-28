import { SHARE_TEXT } from '@/constants/text/share';
import { calculateSettlement } from '@/lib/calc';
import type { Settlement } from '@/types/settlement';

import { formatSettlementText } from './format-settlement-text';

type NativeShareResult = { status: 'shared' | 'cancelled' | 'failed' };

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

/** 운영체제의 공유 시트를 열어 사용자가 원하는 앱을 직접 고르게 한다. */
export const shareSettlementNatively = async (
  settlement: Settlement,
  shareUrl: string,
): Promise<NativeShareResult> => {
  if (typeof navigator.share !== 'function') return { status: 'failed' };

  const result = calculateSettlement(settlement);

  try {
    await navigator.share({
      title: settlement.title.trim() || SHARE_TEXT.defaultTitle,
      text: formatSettlementText(settlement, result, shareUrl),
    });
    return { status: 'shared' };
  } catch (error) {
    if (isAbortError(error)) return { status: 'cancelled' };
    return { status: 'failed' };
  }
};
