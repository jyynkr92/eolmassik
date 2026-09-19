import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettlementStore } from '@/store/settlement-store';
import type { Settlement } from '@/types/settlement';

import ResultSection from './result-section';

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'minsu',
  participants: [
    { id: 'minsu', name: '민수', headcount: 1 },
    { id: 'eunjeong', name: '은정', headcount: 1 },
  ],
  items: [
    {
      id: 'meat',
      name: '고기',
      amount: 32_000,
      payerId: 'minsu',
      participantIds: ['minsu', 'eunjeong'],
      extraCharges: [{ participantId: 'minsu', type: 'amount', value: 12_000 }],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

describe('ResultSection', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.replaceSettlement(settlement);
  });

  it('결제자, 설정한 추가 부담, 실제 항목별 부담액과 최종 송금을 보여준다', async () => {
    const user = userEvent.setup();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '캠핑 정산' })).toBeInTheDocument();
    expect(screen.getByText('은정 → 민수')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: '정산 결과' })).getByText('10,000원'),
    ).toBeInTheDocument();

    await user.click(screen.getByText('고기'));
    const detail = screen.getByText('항목별 부담 금액').parentElement;
    if (!detail) throw new Error('항목 부담액 영역이 없습니다');

    expect(screen.getByText('민수 결제 ·')).toBeInTheDocument();
    expect(screen.getByText('민수 12,000원')).toBeInTheDocument();
    expect(within(detail).getByText('22,000원')).toBeInTheDocument();
    expect(within(detail).getByText('10,000원')).toBeInTheDocument();
  });

  it('송금이 필요 없을 때 안내하고 편집으로 돌아갈 수 있다', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const participant = settlement.participants[0];
    const item = settlement.items[0];
    if (!participant || !item) throw new Error('테스트 정산 항목이 없습니다');

    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      participants: [participant],
      items: [
        {
          ...item,
          participantIds: ['minsu'],
          extraCharges: [],
        },
      ],
    });

    render(<ResultSection headingRef={createRef()} onEdit={onEdit} />);

    expect(screen.getByText('서로 보낼 돈이 없어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('여러 사람이 결제한 항목을 모두 합쳐 최종 송금을 계산한다', async () => {
    const user = userEvent.setup();
    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      items: [
        ...settlement.items,
        {
          id: 'market',
          name: '마트',
          amount: 8_000,
          payerId: 'eunjeong',
          participantIds: ['minsu', 'eunjeong'],
          extraCharges: [],
        },
      ],
    });

    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    const transfers = screen.getByRole('region', { name: '정산 결과' });
    expect(within(transfers).getByText('은정 → 민수')).toBeInTheDocument();
    expect(within(transfers).getByText('6,000원')).toBeInTheDocument();

    await user.click(screen.getByText('마트'));
    expect(screen.getByText('은정 결제 ·')).toBeInTheDocument();
    expect(screen.getAllByText('4,000원')).toHaveLength(2);
  });
});
