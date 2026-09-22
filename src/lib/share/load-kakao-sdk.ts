import type { KakaoSdk } from '@/types/share';

const KAKAO_SCRIPT_ID = 'kakao-javascript-sdk';
const KAKAO_SCRIPT_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';
const KAKAO_SCRIPT_INTEGRITY =
  'sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy';

let pendingSdk: Promise<KakaoSdk> | null = null;

const initKakaoSdk = (javascriptKey: string): KakaoSdk => {
  const sdk = window.Kakao;
  if (!sdk) throw new Error('Kakao SDK를 불러오지 못했습니다');
  if (!sdk.isInitialized()) sdk.init(javascriptKey);
  return sdk;
};

/** 사용자가 공유를 요청할 때만 공식 CDN의 SDK를 로드한다. */
export const loadKakaoSdk = (javascriptKey: string): Promise<KakaoSdk> => {
  if (window.Kakao) return Promise.resolve(initKakaoSdk(javascriptKey));
  if (pendingSdk) return pendingSdk;

  pendingSdk = new Promise<KakaoSdk>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    const handleLoad = () => {
      try {
        resolve(initKakaoSdk(javascriptKey));
      } catch (error) {
        pendingSdk = null;
        reject(error);
      }
    };
    const handleError = () => {
      pendingSdk = null;
      reject(new Error('Kakao SDK 스크립트를 불러오지 못했습니다'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.id = KAKAO_SCRIPT_ID;
      script.src = KAKAO_SCRIPT_URL;
      script.integrity = KAKAO_SCRIPT_INTEGRITY;
      script.crossOrigin = 'anonymous';
      document.head.append(script);
    }
  });

  return pendingSdk;
};
