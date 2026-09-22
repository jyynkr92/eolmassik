import { createFileRoute, useNavigate } from '@tanstack/react-router';

import Button from '@/components/ui/button';
import { SHARE_TEXT } from '@/constants/text/share';
import ResultSection from '@/features/result/result-section';
import { decodeSettlement } from '@/lib/codec';

/**
 * 공유받은 정산 결과 (읽기 전용). 기획설계 5.6
 *
 * 정산 데이터는 `/s#<encoded>` 형태로 URL fragment 에 담긴다. fragment 는
 * 서버로 전송되지 않으므로 서버 로그에 데이터가 남지 않고, 서버 측 URL
 * 길이 제한도 받지 않는다. 기획설계 6.2
 */
const SharedPage = () => {
  const navigate = useNavigate();
  const encoded = window.location.hash.slice(1);
  const decoded = decodeSettlement(encoded);

  const handleHomeClick = () => {
    void navigate({ to: '/' });
  };

  if (!decoded.success) {
    const description =
      encoded === ''
        ? SHARE_TEXT.emptyDescription
        : decoded.error.code === 'unsupported-version'
          ? SHARE_TEXT.unsupportedDescription
          : SHARE_TEXT.invalidDescription;

    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
        <section className="border-outline-base bg-surface-raised flex flex-col gap-3 rounded-2xl border p-5">
          <h1 className="text-on-surface-base text-xl font-bold">{SHARE_TEXT.invalidTitle}</h1>
          <p role="alert" className="text-on-surface-muted text-sm">
            {description}
          </p>
          <Button size="lg" isFullWidth onClick={handleHomeClick}>
            {SHARE_TEXT.homeAction}
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-on-surface-base text-2xl font-bold">{SHARE_TEXT.title}</h1>
        <p className="text-on-surface-muted mt-2 text-sm">{SHARE_TEXT.description}</p>
      </header>
      <ResultSection settlement={decoded.data} isReadOnly />
    </main>
  );
};

export const Route = createFileRoute('/s')({ component: SharedPage });
