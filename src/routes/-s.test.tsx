import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { encodeSettlement } from '@/lib/codec';
import { routeTree } from '@/routeTree.gen';
import type { Settlement } from '@/types/settlement';

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'p1',
  participants: [
    { id: 'p1', name: '민수', headcount: 1 },
    { id: 'p2', name: '은정', headcount: 1 },
  ],
  items: [
    {
      id: 'i1',
      name: '고기',
      amount: 10_000,
      payerId: 'p1',
      participantIds: ['p1', 'p2'],
      extraCharges: [],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

const renderSharedRoute = () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/s'] }),
  });
  return render(<RouterProvider router={router} />);
};

describe('/s 공유 결과', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('검증된 fragment를 읽기 전용 정산 결과로 표시한다', async () => {
    const encoded = encodeSettlement(settlement);
    if (!encoded.success) throw new Error('테스트 정산 인코딩에 실패했습니다');
    window.history.replaceState({}, '', `/s#${encoded.data}`);

    renderSharedRoute();

    expect(await screen.findByRole('heading', { level: 1, name: '공유받은 정산' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: '캠핑 정산' })).toBeVisible();
    expect(screen.getByText('은정 → 민수')).toBeVisible();
    expect(screen.queryByRole('button', { name: '수정하기' })).not.toBeInTheDocument();
  });

  it('fragment가 없으면 오류와 새 정산 진입 동작을 보여준다', async () => {
    window.history.replaceState({}, '', '/s');

    renderSharedRoute();

    expect(await screen.findByRole('heading', { name: '정산 링크를 열 수 없어요' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('공유 링크에 정산 데이터가 없어요');
    expect(screen.getByRole('button', { name: '새 정산 만들기' })).toBeVisible();
  });

  it('변조된 fragment를 렌더링하지 않는다', async () => {
    window.history.replaceState({}, '', '/s#tampered');

    renderSharedRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '링크가 손상되었거나 올바른 정산 데이터가 아니에요',
    );
    expect(screen.queryByText('캠핑 정산')).not.toBeInTheDocument();
  });
});
