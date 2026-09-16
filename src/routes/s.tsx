import { createFileRoute } from '@tanstack/react-router';

import { SHARE_TEXT } from '@/constants/text/share';

/**
 * 공유받은 정산 결과 (읽기 전용). 기획설계 5.6
 *
 * 정산 데이터는 `/s#<encoded>` 형태로 URL fragment 에 담긴다. fragment 는
 * 서버로 전송되지 않으므로 서버 로그에 데이터가 남지 않고, 서버 측 URL
 * 길이 제한도 받지 않는다. 기획설계 6.2
 */
const SharedPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-on-surface-base text-2xl font-bold">{SHARE_TEXT.title}</h1>
      <p className="text-on-surface-muted mt-2 text-sm">{SHARE_TEXT.description}</p>
    </main>
  );
};

export const Route = createFileRoute('/s')({ component: SharedPage });
