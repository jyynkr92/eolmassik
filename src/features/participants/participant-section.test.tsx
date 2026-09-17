import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_HEADCOUNT } from '@/constants/settlement';
import { useSettlementStore } from '@/store/settlement-store';

import ParticipantSection from './participant-section';

type User = ReturnType<typeof userEvent.setup>;

const getNameInput = () => screen.getByLabelText('참여자 이름');
const getChip = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`${name}, \\d+인`) });
const participantsInStore = () => useSettlementStore.getState().settlement.participants;

const addParticipant = async (user: User, name: string) => {
  await user.type(getNameInput(), `${name}{Enter}`);
};

/** 칩을 눌러 상세 시트를 연다. */
const openDetail = async (user: User, name: string) => {
  await user.click(getChip(name));
  return screen.findByRole('dialog');
};

/** 시트를 닫는다. 이름은 이때 저장된다. */
const closeDetail = async (user: User) => {
  await user.keyboard('{Escape}');
};

describe('ParticipantSection', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.reset();
  });

  describe('추가', () => {
    it('엔터로 참여자를 추가하고 입력칸을 비운다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);

      await addParticipant(user, '민수');

      expect(getChip('민수')).toBeInTheDocument();
      expect(getNameInput()).toHaveValue('');
    });

    // 여러 명을 연달아 넣는 화면이라 한 명마다 키보드가 내려가면 입력이 끊긴다
    it('추가한 뒤에도 입력칸에 포커스가 남는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);

      await addParticipant(user, '민수');

      expect(getNameInput()).toHaveFocus();
    });

    it('공백만 있는 이름은 추가하지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);

      await user.type(getNameInput(), '   {Enter}');

      expect(participantsInStore()).toHaveLength(0);
    });

    it('이름 앞뒤 공백을 떼고 저장한다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);

      await addParticipant(user, '  민수  ');

      expect(participantsInStore()[0]?.name).toBe('민수');
    });

    // 결과 화면과 공유 텍스트에는 이름만 나온다. 같은 이름이 둘이면 누구에게 보낼지 알 수 없다
    it('이미 있는 이름은 추가하지 않고 이유를 알려준다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');

      await user.type(getNameInput(), '민수');

      expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 이름이에요');
      expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();

      await user.keyboard('{Enter}');
      expect(participantsInStore()).toHaveLength(1);
    });

    it('앞뒤 공백과 대소문자만 다른 이름도 중복으로 본다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, 'Alice');

      await user.type(getNameInput(), '  alice  ');

      expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 이름이에요');
      expect(participantsInStore()).toHaveLength(1);
    });

    it('참여자가 없으면 안내 문구를 보여준다', () => {
      render(<ParticipantSection />);

      expect(screen.getByText('함께 정산할 사람을 추가해 주세요')).toBeInTheDocument();
    });
  });

  describe('상세 시트 · 인원', () => {
    it('올리고 내리는 게 모두 된다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이네');
      await openDetail(user, '은정이네');

      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      expect(participantsInStore()[0]?.headcount).toBe(3);

      await user.click(screen.getByRole('button', { name: '인원 줄이기' }));
      expect(participantsInStore()[0]?.headcount).toBe(2);
    });

    // 순환 방식에서는 2 에서 1 로 가려면 상한까지 여덟 번 눌러야 했다
    it('1 아래로는 내려가지 않는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      expect(screen.getByRole('button', { name: '인원 줄이기' })).toBeDisabled();
      expect(participantsInStore()[0]?.headcount).toBe(1);
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
      expect(participantsInStore()[0]?.headcount).toBe(MAX_HEADCOUNT);
    });

    it('인원이 2 이상이면 칩에 표시한다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이네');
      await openDetail(user, '은정이네');

      await user.click(screen.getByRole('button', { name: '인원 늘리기' }));
      // 시트가 열려 있으면 Radix 가 뒤쪽을 aria-hidden 으로 덮어 칩이 조회되지 않는다
      await user.keyboard('{Escape}');

      expect(await screen.findByRole('button', { name: /은정이네, 2인/ })).toBeInTheDocument();
    });
  });

  describe('상세 시트 · 이름', () => {
    // 지웠다 다시 넣으면 id 가 바뀌어 항목의 부담자 목록이 함께 날아간다
    it('id 를 유지한 채 이름만 바꾼다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '은정이');
      const originalId = participantsInStore()[0]?.id;

      await openDetail(user, '은정이');
      await user.type(screen.getByLabelText('이름'), '네');
      await closeDetail(user);

      expect(participantsInStore()[0]?.name).toBe('은정이네');
      expect(participantsInStore()[0]?.id).toBe(originalId);
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
      expect(screen.getByLabelText('이름')).toHaveValue('민수');
    });

    it('이름을 비우면 저장하지 않고 오류를 보여준다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await openDetail(user, '민수');

      await user.clear(screen.getByLabelText('이름'));

      expect(screen.getByRole('alert')).toHaveTextContent('이름을 입력해 주세요');

      await closeDetail(user);
      expect(participantsInStore()[0]?.name).toBe('민수');
    });
  });

  describe('상세 시트 · 삭제', () => {
    it('해당 참여자만 지우고 시트를 닫는다', async () => {
      const user = userEvent.setup();
      render(<ParticipantSection />);
      await addParticipant(user, '민수');
      await addParticipant(user, '지영');
      await openDetail(user, '민수');

      await user.click(screen.getByRole('button', { name: '삭제하기' }));

      expect(participantsInStore().map((participant) => participant.name)).toEqual(['지영']);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
