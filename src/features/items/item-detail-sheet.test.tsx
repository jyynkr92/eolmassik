import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSettlementStore } from '@/store/settlement-store';

import ItemSection from './item-section';

type User = ReturnType<typeof userEvent.setup>;

const settlementInStore = () => useSettlementStore.getState().settlement;
const firstItem = () => settlementInStore().items[0];
const participantNamed = (name: string) => {
  const participant = settlementInStore().participants.find((it) => it.name === name);
  if (!participant) throw new Error(`참여자 ${name} 이 없습니다`);

  return participant;
};

const addParticipants = (...names: string[]) => {
  const { addParticipant } = useSettlementStore.getState().actions;
  for (const name of names) addParticipant(name);
};

/**
 * 항목 하나를 만들고 상세 시트를 연다.
 *
 * 금액은 열기 전에 채운다. 금액 칸은 행에 있고 시트가 그 위를 덮으므로, 열어 둔 채로는
 * 누를 수 없다.
 */
const openDetail = async (user: User, amount?: string) => {
  await user.click(screen.getByRole('button', { name: '항목 추가' }));
  if (amount !== undefined) await user.type(screen.getByLabelText('금액'), amount);

  await user.click(screen.getByRole('button', { name: '이름 없는 항목 상세 설정' }));

  return screen.findByRole('dialog');
};

/** 부담자 행의 체크박스. 인원이 2 이상이면 이름 뒤에 인원이 붙는다. */
const getBearerRow = (name: string) => screen.getByRole('checkbox', { name: new RegExp(name) });

const getExtraChargeToggle = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^${name} 추가 부담$`) });

const getButtonAt = (name: string, index: number) => {
  const button = screen.getAllByRole('button', { name })[index];
  if (!button) throw new Error(`${name} 버튼 ${index}이 없습니다`);
  return button;
};

describe('항목 상세 시트', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.reset();
    addParticipants('민수', '은정이네', '지영');
  });

  describe('결제자', () => {
    it('결제자를 바꾼다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user);

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: '지영' }));

      expect(firstItem()?.payerId).toBe(participantNamed('지영').id);
    });

    // 결제자 없는 항목은 정산에서 통째로 빠진다. 되돌릴 화면이 여기밖에 없다
    it('결제자가 없으면 정산에서 빠진다고 알린다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user);

      expect(screen.getByText('이 항목을 실제로 결제한 사람이에요')).toBeInTheDocument();

      // 기본 결제자였던 사람을 지우면 이 항목의 결제자 자리가 빈다
      act(() => {
        useSettlementStore.getState().actions.removeParticipant(participantNamed('민수').id);
      });

      expect(screen.getByText('결제자를 골라야 이 항목이 정산에 들어가요')).toBeInTheDocument();
    });
  });

  describe('N빵 참여', () => {
    it('체크를 풀면 그 사람은 N빵 대상에서 빠진다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user);

      await user.click(getBearerRow('지영'));

      expect(firstItem()?.participantIds).not.toContain(participantNamed('지영').id);

      await user.click(getBearerRow('지영'));

      expect(firstItem()?.participantIds).toContain(participantNamed('지영').id);
    });

    it('체크를 풀어도 직접 지정한 추가 부담은 유지한다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user, '30000');

      await user.click(getExtraChargeToggle('지영'));
      await user.type(screen.getByLabelText('지영 추가 부담 금액'), '6000');
      await user.click(getBearerRow('지영'));

      expect(firstItem()?.participantIds).not.toContain(participantNamed('지영').id);
      expect(firstItem()?.extraCharges).toEqual([
        { participantId: participantNamed('지영').id, type: 'amount', value: 6000 },
      ]);
      expect(getBearerRow('지영')).toHaveAccessibleName(/지영\s*6,000원/);
      expect(screen.getByText(/체크를 풀면 N빵에서 빠져요/)).toBeInTheDocument();
    });

    // 시트의 금액과 결과 화면의 금액이 다르면 어느 쪽을 믿어야 할지 알 수 없다
    it('부담액을 행마다 보여주고 토글에 맞춰 바꾼다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user, '30000');

      expect(getBearerRow('민수')).toHaveAccessibleName(/10,000원/);

      await user.click(getBearerRow('지영'));

      expect(getBearerRow('민수')).toHaveAccessibleName(/15,000원/);
      expect(getBearerRow('지영')).toHaveAccessibleName(/0원/);
    });
  });

  describe('추가 부담', () => {
    it('금액을 넣으면 나머지 사람의 부담액이 바로 줄어든다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user, '30000');

      await user.click(getExtraChargeToggle('은정이네'));
      await user.type(screen.getByLabelText('은정이네 추가 부담 금액'), '12000');

      expect(firstItem()?.extraCharges).toEqual([
        { participantId: participantNamed('은정이네').id, type: 'amount', value: 12000 },
      ]);
      expect(getBearerRow('민수')).toHaveAccessibleName(/6,000원/);
      expect(getBearerRow('은정이네')).toHaveAccessibleName(/18,000원/);
    });

    it('전액 토글을 켜면 그 사람이 항목 금액을 다 진다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user, '30000');

      await user.click(getExtraChargeToggle('은정이네'));
      await user.click(screen.getByRole('button', { name: '전액' }));

      expect(firstItem()?.extraCharges).toEqual([
        { participantId: participantNamed('은정이네').id, type: 'full' },
      ]);
      expect(getBearerRow('은정이네')).toHaveAccessibleName(/30,000원/);
      expect(getBearerRow('민수')).toHaveAccessibleName(/0원/);

      // 전액일 때 금액은 항목 금액으로 고정이라 칸을 잠근다
      expect(screen.getByLabelText('은정이네 추가 부담 금액')).toBeDisabled();
    });

    it('다시 누르면 추가 부담이 사라진다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user);

      await user.click(getExtraChargeToggle('은정이네'));
      await user.click(screen.getByRole('button', { name: '은정이네 추가 부담 빼기' }));

      expect(firstItem()?.extraCharges).toEqual([]);
      expect(screen.queryByLabelText('은정이네 추가 부담 금액')).not.toBeInTheDocument();
    });

    // 0원 부담은 부담이 아니다. 펼쳐만 두고 만 상태가 아무것도 안 한 것과 같아야 한다
    it('펼치기만 하면 요약줄에 아무것도 붙지 않는다', async () => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await openDetail(user);

      await user.click(getExtraChargeToggle('은정이네'));
      await user.keyboard('{Escape}');

      expect(screen.queryByText(/은정이네 \+/)).not.toBeInTheDocument();
    });
  });

  it('제외된 결제자의 추가 부담을 펼치거나 비워도 잔돈 배분을 바꾸지 않는다', async () => {
    const user = userEvent.setup();
    render(<ItemSection />);
    await openDetail(user, '10001');
    await user.click(getBearerRow('민수'));

    const expectOriginalShares = () => {
      expect(getBearerRow('민수')).toHaveAccessibleName(/민수\s*0원/);
      expect(getBearerRow('은정이네')).toHaveAccessibleName(/은정이네\s*5,001원/);
      expect(getBearerRow('지영')).toHaveAccessibleName(/지영\s*5,000원/);
    };
    expectOriginalShares();
    await user.click(getExtraChargeToggle('민수'));
    expect(firstItem()?.extraCharges).toEqual([]);
    expectOriginalShares();

    await user.type(screen.getByLabelText('민수 추가 부담 금액'), '100');
    await user.clear(screen.getByLabelText('민수 추가 부담 금액'));
    expect(firstItem()?.extraCharges).toEqual([]);
    expectOriginalShares();

    await user.click(screen.getByRole('button', { name: '전액' }));
    await user.click(screen.getByRole('button', { name: '전액' }));
    expect(firstItem()?.extraCharges).toEqual([]);
    expectOriginalShares();
  });

  it('전액 입력칸은 다른 사람의 지정 부담을 뺀 실제 부담액을 표시한다', async () => {
    const user = userEvent.setup();
    render(<ItemSection />);
    await openDetail(user, '30000');
    await user.click(getExtraChargeToggle('민수'));
    await user.type(screen.getByLabelText('민수 추가 부담 금액'), '10000');
    await user.click(getExtraChargeToggle('은정이네'));
    await user.click(getButtonAt('전액', 1));

    expect(screen.getByLabelText('은정이네 추가 부담 금액')).toHaveValue('20,000');
    expect(getBearerRow('은정이네')).toHaveAccessibleName(/은정이네\s*20,000원/);

    await user.click(getExtraChargeToggle('지영'));
    await user.click(getButtonAt('전액', 2));
    expect(screen.getByLabelText('은정이네 추가 부담 금액')).toHaveValue('10,000');
    expect(screen.getByLabelText('지영 추가 부담 금액')).toHaveValue('10,000');
  });

  it.each(['닫기', 'Escape'])(
    '삭제 확인에서 %s 후 같은 항목과 다른 항목은 편집 화면으로 열린다',
    async (closeAction) => {
      const user = userEvent.setup();
      render(<ItemSection />);
      await user.click(screen.getByRole('button', { name: '항목 추가' }));
      await user.click(screen.getByRole('button', { name: '항목 추가' }));

      for (const nextIndex of [0, 1]) {
        await user.click(getButtonAt('이름 없는 항목 상세 설정', 0));
        await user.click(screen.getByRole('button', { name: '항목 삭제하기' }));
        expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
        if (closeAction === 'Escape') await user.keyboard('{Escape}');
        else await user.click(screen.getByRole('button', { name: '닫기' }));

        await user.click(getButtonAt('이름 없는 항목 상세 설정', nextIndex));
        expect(screen.getByRole('button', { name: '적용' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '적용' }));
      }
      expect(settlementInStore().items).toHaveLength(2);
    },
  );

  // 항목 상세는 스토어에 바로 쓰므로 적용은 닫기와 같다. 끝나는 지점이 있어야 한다
  it('적용 버튼으로 시트를 닫는다', async () => {
    const user = userEvent.setup();
    render(<ItemSection />);
    await openDetail(user);

    await user.click(screen.getByRole('button', { name: '적용' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // 시트에서 고친 값이 그 자리에서 요약줄로 이어져야 한다
  it('시트에서 고친 내용이 행 요약에 반영된다', async () => {
    const user = userEvent.setup();
    render(<ItemSection />);
    await openDetail(user, '30000');

    await user.click(getExtraChargeToggle('은정이네'));
    await user.type(screen.getByLabelText('은정이네 추가 부담 금액'), '12000');
    await user.keyboard('{Escape}');

    expect(screen.getByText(/은정이네 \+12,000/)).toBeInTheDocument();
  });
});
