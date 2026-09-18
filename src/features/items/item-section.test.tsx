import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSettlementStore } from '@/store/settlement-store';

import ItemSection from './item-section';

type User = ReturnType<typeof userEvent.setup>;

const settlementInStore = () => useSettlementStore.getState().settlement;
const itemsInStore = () => settlementInStore().items;
const firstItem = () => itemsInStore()[0];

const addParticipants = (...names: string[]) => {
  const { addParticipant } = useSettlementStore.getState().actions;
  for (const name of names) addParticipant(name);
};

const addItem = async (user: User) => {
  await user.click(screen.getByRole('button', { name: '항목 추가' }));
};

const getRow = (index: number) => {
  const row = screen.getAllByRole('listitem')[index];
  if (!row) throw new Error(`${index}번째 항목 행이 없습니다`);

  return row;
};

describe('ItemSection', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.reset();
  });

  describe('참여자가 없을 때', () => {
    // 참여자가 없으면 결제자 없는 항목이 되어 정산에서 통째로 빠진다
    it('항목을 추가할 수 없고 이유를 알려준다', () => {
      render(<ItemSection />);

      expect(screen.getByRole('button', { name: '항목 추가' })).toBeDisabled();
      expect(screen.getByText('참여자를 먼저 추가해 주세요')).toBeInTheDocument();
    });

    // 이유가 빈 상태 안에만 있으면, 항목을 만든 뒤 참여자를 지웠을 때 찾을 데가 없다
    it('항목이 남아 있어도 이유를 계속 보여준다', async () => {
      const user = userEvent.setup();
      addParticipants('민수');
      render(<ItemSection />);
      await addItem(user);

      const { removeParticipant } = useSettlementStore.getState().actions;
      removeParticipant(`${settlementInStore().participants[0]?.id}`);

      // findBy 로 리렌더를 기다린 뒤 버튼 상태를 본다
      expect(await screen.findByText('참여자를 먼저 추가해 주세요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '항목 추가' })).toBeDisabled();
    });
  });

  describe('항목 추가', () => {
    beforeEach(() => {
      addParticipants('민수', '은정이네', '지영');
    });

    it('빈 항목을 만들고 부담자를 전원으로 채운다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);

      await addItem(user);

      expect(firstItem()?.participantIds).toHaveLength(3);
      expect(firstItem()?.amount).toBe(0);
    });

    it('결제자를 기본 결제자로 채운다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);

      await addItem(user);

      expect(firstItem()?.payerId).toBe(settlementInStore().defaultPayerId);
      expect(firstItem()?.payerId).not.toBe('');
    });

    it('항목이 없으면 안내 문구를 보여준다', () => {
      render(<ItemSection />);

      expect(screen.getByText('함께 쓴 돈을 항목으로 넣어 주세요')).toBeInTheDocument();
    });
  });

  describe('행 편집', () => {
    beforeEach(() => {
      addParticipants('민수', '은정이네', '지영');
    });

    it('이름과 금액을 행에서 바로 고친다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      const row = getRow(0);
      await user.type(within(row).getByLabelText('항목 이름'), '고기');
      await user.type(within(row).getByLabelText('금액'), '32000');

      expect(firstItem()?.name).toBe('고기');
      expect(firstItem()?.amount).toBe(32000);
    });

    it('금액에 쉼표를 넣어 보여준다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      await user.type(within(getRow(0)).getByLabelText('금액'), '32000');

      expect(within(getRow(0)).getByLabelText('금액')).toHaveValue('32,000');
    });

    it('해당 항목만 지운다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);
      await addItem(user);
      await user.type(within(getRow(0)).getByLabelText('항목 이름'), '고기');

      await user.click(within(getRow(0)).getByRole('button', { name: '삭제' }));

      expect(itemsInStore()).toHaveLength(1);
      expect(itemsInStore()[0]?.name).toBe('');
    });

    // 라벨이 모든 행에서 같아, 묶음 이름이 없으면 어느 항목인지 알 수 없다
    it('행을 항목 이름으로 묶어 읽게 한다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      expect(screen.getByRole('group', { name: '이름 없는 항목' })).toBeInTheDocument();

      await user.type(within(getRow(0)).getByLabelText('항목 이름'), '고기');
      expect(screen.getByRole('group', { name: '고기' })).toBeInTheDocument();
    });
  });

  describe('요약과 합계', () => {
    beforeEach(() => {
      addParticipants('민수', '은정이네', '지영');
    });

    // 모든 행에 "3명 N빵" 을 적으면 정작 예외인 줄이 묻힌다
    it('전원이 똑같이 나누면 요약을 붙이지 않는다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      expect(within(getRow(0)).queryByText(/부담/)).not.toBeInTheDocument();
      expect(within(getRow(0)).queryByText(/전액/)).not.toBeInTheDocument();
    });

    it('일부만 부담하면 인원을 알려준다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      const { toggleItemParticipant } = useSettlementStore.getState().actions;
      const [excluded] = settlementInStore().participants;
      if (excluded) toggleItemParticipant(`${firstItem()?.id}`, excluded.id);

      expect(await within(getRow(0)).findByText('2명만 부담')).toBeInTheDocument();
    });

    it('부담자가 없으면 결제자가 전액을 진다고 알려준다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      const { toggleItemParticipant } = useSettlementStore.getState().actions;
      const itemId = `${firstItem()?.id}`;
      for (const participant of settlementInStore().participants) {
        toggleItemParticipant(itemId, participant.id);
      }

      expect(await within(getRow(0)).findByText('민수 혼자 부담')).toBeInTheDocument();
    });

    it('추가 부담이 있으면 그것만 적는다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);

      const { setExtraCharge } = useSettlementStore.getState().actions;
      const payer = settlementInStore().participants[1];
      if (payer) setExtraCharge(`${firstItem()?.id}`, { participantId: payer.id, type: 'full' });

      expect(await within(getRow(0)).findByText('은정이네 전액')).toBeInTheDocument();
    });

    // 참여자를 지우면 그 사람을 결제자로 쓰던 항목이 정산에서 통째로 빠진다
    it('결제자가 사라지면 행과 합계 양쪽에서 알린다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);
      await user.type(within(getRow(0)).getByLabelText('금액'), '30000');

      const { removeParticipant } = useSettlementStore.getState().actions;
      removeParticipant(`${settlementInStore().defaultPayerId}`);

      expect(await within(getRow(0)).findByText(/결제자 없음/)).toBeInTheDocument();
      expect(screen.getByText('결제자가 없는 항목 1개는 합계에서 빠졌어요')).toBeInTheDocument();
      expect(screen.getByText('0원')).toBeInTheDocument();
    });

    it('항목 금액을 더해 합계를 보여준다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await addItem(user);
      await addItem(user);

      await user.type(within(getRow(0)).getByLabelText('금액'), '32000');
      await user.type(within(getRow(1)).getByLabelText('금액'), '8000');

      expect(screen.getByText('40,000원')).toBeInTheDocument();
    });
  });
});
