import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUuid } from './uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createUuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UUID v4 형식을 만든다', () => {
    expect(createUuid()).toMatch(UUID_V4);
  });

  it('호출할 때마다 다른 값을 만든다', () => {
    const ids = new Set(Array.from({ length: 100 }, createUuid));

    expect(ids.size).toBe(100);
  });

  it('crypto.randomUUID 가 없어도 동작한다', () => {
    // 비보안 컨텍스트(http://192.168.x.x)에서는 randomUUID 만 빠지고
    // getRandomValues 는 그대로 쓸 수 있다.
    const realCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {
      getRandomValues: realCrypto.getRandomValues.bind(realCrypto),
    });

    expect(createUuid()).toMatch(UUID_V4);
  });
});
