import { compressToBase64 } from 'lz-string';
import { describe, expect, it } from 'vitest';

import { decodeSettlement } from './decode-settlement';

const encodeUnknown = (value: unknown): string =>
  compressToBase64(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');

describe('decodeSettlement', () => {
  it('손상된 문자열을 던지지 않고 실패 결과로 돌려준다', () => {
    expect(decodeSettlement('not-a-valid-payload')).toEqual({
      success: false,
      error: { code: 'invalid-payload' },
    });
  });

  it('지원하지 않는 버전을 구분한다', () => {
    expect(decodeSettlement(encodeUnknown([2]))).toEqual({
      success: false,
      error: { code: 'unsupported-version' },
    });
  });

  it('범위를 벗어난 참여자 참조를 거부한다', () => {
    const compact = [1, '정산', 0, [['민수', 1]], [['고기', 10_000, 1, [0], []]], [0, 0, 0], 0];

    expect(decodeSettlement(encodeUnknown(compact))).toEqual({
      success: false,
      error: { code: 'invalid-payload' },
    });
  });
});
