type KakaoShareTemplate = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
};

export type KakaoSdk = {
  init: (javascriptKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (template: KakaoShareTemplate) => Promise<unknown> | undefined;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}
