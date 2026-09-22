import { decompressFromBase64 } from 'lz-string';

import type { DecodeSettlementResult } from '@/types/codec';

import {
  CODEC_VERSION,
  compactSettlementSchema,
  expandSettlement,
  MAX_ENCODED_LENGTH,
} from './schema';

const fromBase64Url = (value: string): string => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
};

/** 외부에서 받은 문자열을 압축 해제하고 버전·구조·참조를 검증한다. */
export const decodeSettlement = (encoded: string): DecodeSettlementResult => {
  if (encoded === '' || encoded.length > MAX_ENCODED_LENGTH) {
    return { success: false, error: { code: 'invalid-payload' } };
  }

  try {
    const json = decompressFromBase64(fromBase64Url(encoded));
    if (!json) return { success: false, error: { code: 'invalid-payload' } };

    const unknownValue: unknown = JSON.parse(json);
    if (
      Array.isArray(unknownValue) &&
      typeof unknownValue[0] === 'number' &&
      unknownValue[0] !== CODEC_VERSION
    ) {
      return { success: false, error: { code: 'unsupported-version' } };
    }

    const parsed = compactSettlementSchema.safeParse(unknownValue);
    if (!parsed.success) return { success: false, error: { code: 'invalid-payload' } };

    return { success: true, data: expandSettlement(parsed.data) };
  } catch {
    return { success: false, error: { code: 'invalid-payload' } };
  }
};
