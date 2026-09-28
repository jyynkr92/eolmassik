import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';
import { useSettlementStore } from '@/store/settlement-store';
import type { Settlement } from '@/types/settlement';

const settlement: Settlement = {
  id: 'settlement',
  title: '',
  createdAt: 0,
  defaultPayerId: 'payer',
  participants: [{ id: 'payer', name: '민수', headcount: 1 }],
  items: [
    {
      id: 'item',
      name: '고기',
      amount: 10_000,
      payerId: 'payer',
      participantIds: ['payer'],
      extraCharges: [],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

const renderHome = () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
};

describe('결과 보기 흐름', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.replaceSettlement(settlement);
  });

  it('제출 후 결과 제목으로, 수정 후 편집 제목으로 초점을 옮긴다', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(await screen.findByRole('button', { name: '결과 보기' }));
    expect(screen.getByRole('heading', { level: 2, name: '정산 결과' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(screen.getByRole('heading', { level: 1, name: '얼마씩' })).toHaveFocus();
  });

  it('결제자가 빠진 항목이 있으면 결과 보기를 막고 이유를 알려준다', async () => {
    const item = settlement.items[0];
    if (!item) throw new Error('테스트 항목이 없습니다');

    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      items: [{ ...item, payerId: '' }],
    });
    renderHome();

    expect(await screen.findByRole('button', { name: '결과 보기' })).toBeDisabled();
    expect(
      screen.getByText('결제자가 없는 항목 1개의 결제자를 먼저 지정해 주세요'),
    ).toBeInTheDocument();
  });

  it('입력 단계에서 확인 후 정산을 초기화한다', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(await screen.findByRole('button', { name: '초기화' }));
    expect(screen.getByRole('dialog', { name: '새 정산을 시작할까요?' })).toHaveTextContent(
      '입력한 참여자와 항목이 모두 사라져요',
    );

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(useSettlementStore.getState().settlement.items).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '초기화' }));
    await user.click(screen.getByRole('button', { name: '새로 시작' }));

    expect(useSettlementStore.getState().settlement.participants).toEqual([]);
    expect(useSettlementStore.getState().settlement.items).toEqual([]);
    expect(screen.getByRole('heading', { level: 1, name: '얼마씩' })).toHaveFocus();
    expect(screen.getByRole('button', { name: '결과 보기' })).toBeDisabled();
  });

  it('결과 단계에서 새로운 정산을 시작한다', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(await screen.findByRole('button', { name: '결과 보기' }));
    await user.click(screen.getByRole('button', { name: '새로운 정산하기' }));
    await user.click(screen.getByRole('button', { name: '새로 시작' }));

    expect(screen.getByRole('heading', { level: 1, name: '얼마씩' })).toHaveFocus();
    expect(screen.getByText('함께 정산할 사람을 추가해 주세요')).toBeInTheDocument();
  });
});
