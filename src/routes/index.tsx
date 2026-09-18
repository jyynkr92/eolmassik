import { createFileRoute } from '@tanstack/react-router';

import { COMMON_TEXT } from '@/constants/text/common';
import { HOME_TEXT } from '@/constants/text/home';
import ItemSection from '@/features/items/item-section';
import ParticipantSection from '@/features/participants/participant-section';

/**
 * 편집 화면. 기획설계 5.1 의 [1]~[4] 를 한 페이지 안의 섹션으로 푼다.
 * 라우트를 나누면 뒤로 가기마다 작성 중인 정산이 끊긴다.
 */
const HomePage = () => {
  return (
    <main className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-on-surface-base text-2xl font-bold">{COMMON_TEXT.appName}</h1>
        <p className="text-on-surface-muted mt-2 text-sm">{HOME_TEXT.tagline}</p>
      </header>

      <ParticipantSection />
      <ItemSection />
    </main>
  );
};

export const Route = createFileRoute('/')({ component: HomePage });
