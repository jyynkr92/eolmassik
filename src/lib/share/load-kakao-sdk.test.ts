import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadKakaoSdk } from './load-kakao-sdk';

describe('loadKakaoSdk', () => {
  afterEach(() => {
    window.Kakao = undefined;
    document.getElementById('kakao-javascript-sdk')?.remove();
  });

  it('SDK를 한 번만 초기화하고 이미 로드된 인스턴스를 반환한다', async () => {
    const init = vi.fn();
    window.Kakao = {
      init,
      isInitialized: vi.fn(() => false),
      Share: { sendDefault: vi.fn() },
    };

    await expect(loadKakaoSdk('javascript-key')).resolves.toBe(window.Kakao);
    expect(init).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith('javascript-key');
  });
});
