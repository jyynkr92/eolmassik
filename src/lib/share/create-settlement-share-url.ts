import { URL_FALLBACK_THRESHOLD } from '@/constants/settlement';
import { encodeSettlement } from '@/lib/codec';
import type { Settlement } from '@/types/settlement';

type ShareUrlError = 'invalid-settlement' | 'too-long';

type ShareUrlResult = { success: true; data: string } | { success: false; error: ShareUrlError };

/** 정산 데이터가 서버로 전송되지 않도록 `/s`의 fragment에만 담는다. */
export const createSettlementShareUrl = (
  settlement: Settlement,
  origin = window.location.origin,
): ShareUrlResult => {
  const encoded = encodeSettlement(settlement);
  if (!encoded.success) return { success: false, error: 'invalid-settlement' };

  const url = new URL('/s', origin);
  url.hash = encoded.data;
  const shareUrl = url.toString();
  if (shareUrl.length >= URL_FALLBACK_THRESHOLD) {
    return { success: false, error: 'too-long' };
  }

  return { success: true, data: shareUrl };
};
