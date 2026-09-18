import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_HEADCOUNT } from '@/constants/settlement';
import { useSettlementStore } from '@/store/settlement-store';

import ParticipantSection from './participant-section';

type User = ReturnType<typeof userEvent.setup>;

const getChip = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`${name}, \\d+인`) });
const participantsInStore = () => useSettlementStore.getState().settlement.participants;
const firstParticipant = () => participantsInStore()[0];

const addParticipant = async (user: User, name: string) => {
  await user.type(screen.getByLabelText('참여자 이름'), `${name}{Enter}`);
};

/** 칩을 눌러 상세 시트를 연다. */
const openDetail = async (user: User, name: string) => {
  await user.click(getChip(name));
  return screen.findByRole('dialog');
};

/** 시트를 닫는다. 저장은 이때 일어난다. */
const closeDetail = async (user: User) => {
  await user.keyboard('{Escape}');
};

/** 삭제는 한 번 더 묻는다. 되돌리기가 없어서 누르는 즉시 사라지면 안 된다. */
const removeParticipant = async (user: User) => {
  await user.click(screen.getByRole('button', { name: '삭제하기' }));
  await user.click(screen.getByRole('button', { name: '삭제' }));
};

describe('참여자 상세 시트', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.reset();
  });

  it('제목은 연 시점의 이름으로 고정한다', async () => {
    const user = userEvent.setup();
    render(<ParticipantSection />);
    await addParticipant(user, '민수');
    await openDetail(user, '민수');

    expect(screen.getByRole('dialog', { name: /민수 수정/ })).toBeInTheDocument();

    // Dialog 이름이 글자마다 바뀌면 스크린리더가 그때마다 다시 읽는다
    await user.type(screen.getByLabelText('이름'), '네');

    expect(screen.getByRole('dialog', { name: /민수 수정/ })).toBeInTheDocument();
  });

  describe('인원', () => {
    it('올리고 내리는 게 모두 된다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이네');
      await openDetail(user, '은정이네');

      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await user.click(screen.getByRole('button', { name: '인원 줄이기' }));
      await closeDetail(user);

      expect(firstParticipant()?.headcount).toBe(2);
    });

    it('1 아래로는 내려가지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      expect(screen.getByRole('button', { name: '인원 줄이기' })).toBeDisabled();
    });

    it('상한에서 더 올라가지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '대가족');
      await openDetail(user, '대가족');

      const increase = screen.getByRole('button', { name: '인원 늘리기' });
      for (let count = 1; count < MAX_HEADCOUNT; count += 1) {
        await user.click(increase);
      }
      expect(increase).toBeDisabled();

      await closeDetail(user);
      expect(firstParticipant()?.headcount).toBe(MAX_HEADCOUNT);
    });

    it('인원이 2 이상이면 칩에 표시한다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이네');
      await openDetail(user, '은정이네');

      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await closeDetail(user);

      expect(await screen.findByRole('button', { name: /은정이네, 2인/ })).toBeInTheDocument();
    });

    // 이름이 유효하지 않아 버려져도 인원은 저장되어야 한다
    it('이름이 비어 있어도 인원은 저장한다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      await user.clear(screen.getByLabelText('이름'));
      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await closeDetail(user);

      expect(firstParticipant()?.name).toBe('민수');
      expect(firstParticipant()?.headcount).toBe(2);
    });
  });

  describe('이름', () => {
    // 지웠다 다시 넣으면 id 가 바뀌어 항목의 부담자 목록이 함께 날아간다
    it('id 를 유지한 채 이름만 바꾼다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이');
      const originalId = firstParticipant()?.id;

      await openDetail(user, '은정이');
      await user.type(screen.getByLabelText('이름'), '네');
      await closeDetail(user);

      expect(firstParticipant()?.name).toBe('은정이네');
      expect(firstParticipant()?.id).toBe(originalId);
    });

    it('이름을 비우면 저장하지 않고 오류를 보여준다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      await user.clear(screen.getByLabelText('이름'));
      expect(screen.getByRole('alert')).toHaveTextContent('이름을 입력해 주세요');

      await closeDetail(user);
      expect(firstParticipant()?.name).toBe('민수');
    });

    it('다른 참여자와 겹치는 이름으로는 바꾸지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');
      await openDetail(user, '지영');

      const nameInput = screen.getByLabelText('이름');
      await user.clear(nameInput);
      await user.type(nameInput, '민수');
      expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 이름이에요');

      await closeDetail(user);
      expect(participantsInStore().map((participant) => participant.name)).toEqual([
        '민수',
        '지영',
      ]);
    });

    // 이름을 그대로 둔 채 인원만 바꾸려는 경우까지 막으면 안 된다
    it('자기 이름은 중복으로 보지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 시트를 닫아도 언마운트하지 않으므로, 열 때마다 초기화되지 않으면 버린 값이 되살아난다
    it('저장하지 않고 버린 편집은 다시 열 때 남아 있지 않다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');

      await openDetail(user, '민수');
      await user.clear(screen.getByLabelText('이름'));
      await closeDetail(user);

      await openDetail(user, '민수');
      expect(screen.getByLabelText('이름')).toHaveValue('민수');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // 바로 반영되는 줄 모르는 사람에게 끝나는 지점을 준다
  it('적용 버튼이 닫기와 같은 길이다', async () => {
    const user = userEvent.setup();
    render(<ParticipantSection />);
    await addParticipant(user, '민수');
    await openDetail(user, '민수');

    await user.clear(screen.getByLabelText('이름'));
    await user.type(screen.getByLabelText('이름'), '민수네');
    await user.click(screen.getByRole('button', { name: '적용' }));

    expect(participantsInStore()[0]?.name).toBe('민수네');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('기본 결제자', () => {
    // 지금까지 이 값은 처음 추가한 참여자로 조용히 정해지고 바꿀 길이 없었다
    it('다른 사람을 기본 결제자로 지정한다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');
      await openDetail(user, '지영');

      await user.click(screen.getByRole('button', { name: '기본 결제자로 지정' }));

      const settlement = useSettlementStore.getState().settlement;
      const 지영 = settlement.participants.find((participant) => participant.name === '지영');
      expect(settlement.defaultPayerId).toBe(지영?.id);
      expect(screen.getByText('이 사람이 기본 결제자예요')).toBeInTheDocument();
    });

    it('이미 기본 결제자면 지정 버튼을 두지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      expect(screen.queryByRole('button', { name: '기본 결제자로 지정' })).not.toBeInTheDocument();
      expect(screen.getByText('이 사람이 기본 결제자예요')).toBeInTheDocument();
    });

    // 칩만 보고도 누가 기본 결제자인지 알 수 있어야 한다
    it('칩에 기본 결제자를 드러낸다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');

      expect(getChip('민수')).toHaveAccessibleName(/기본 결제자/);
      expect(within(getChip('민수')).getByText('결제')).toBeInTheDocument();
      expect(getChip('지영')).not.toHaveAccessibleName(/기본 결제자/);
    });
  });

  describe('삭제', () => {
    it('해당 참여자만 지우고 시트를 닫는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');
      await openDetail(user, '민수');

      await removeParticipant(user);

      expect(participantsInStore().map((participant) => participant.name)).toEqual(['지영']);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 시트를 겹쳐 띄우는 대신 같은 시트가 확인 화면으로 바뀐다
    it('확인 화면으로 바뀌고 취소하면 돌아온다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      await user.click(screen.getByRole('button', { name: '삭제하기' }));

      expect(screen.getByRole('dialog', { name: /민수 삭제/ })).toBeInTheDocument();
      expect(screen.queryByLabelText('이름')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(participantsInStore()).toHaveLength(1);
      expect(screen.getByLabelText('이름')).toBeInTheDocument();
    });

    it('좌상단 뒤로 가기로도 돌아온다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      await user.click(screen.getByRole('button', { name: '삭제하기' }));
      await user.click(screen.getByRole('button', { name: '뒤로' }));

      expect(participantsInStore()).toHaveLength(1);
      expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument();
    });

    // 사라질 참여자의 이름과 인원을 쓸 이유가 없다
    it('지우기 직전의 편집은 저장하지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');
      await openDetail(user, '지영');

      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await removeParticipant(user);

      expect(participantsInStore().map((participant) => participant.name)).toEqual(['민수']);
    });
  });
});
