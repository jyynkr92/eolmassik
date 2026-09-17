import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSettlementStore } from '@/store/settlement-store';

import ParticipantSection from './participant-section';

const getNameInput = () => screen.getByLabelText('참여자 이름');
const participantsInStore = () => useSettlementStore.getState().settlement.participants;

const addParticipant = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.type(getNameInput(), `${name}{Enter}`);
};

describe('참여자 추가', () => {
  beforeEach(() => {
    useSettlementStore.getState().actions.reset();
  });

  it('엔터로 추가하고 입력칸을 비운다', async () => {
    const user = userEvent.setup();
    render(<ParticipantSection />);

    await addParticipant(user, '민수');

    expect(screen.getByRole('button', { name: /민수, 1인/ })).toBeInTheDocument();
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

  it('빈 칸일 때는 오류를 띄우지 않는다', () => {
    render(<ParticipantSection />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });

  it('이름 앞뒤 공백을 떼고 저장한다', async () => {
    const user = userEvent.setup();
    render(<ParticipantSection />);

    await addParticipant(user, '  민수  ');

    expect(participantsInStore()[0]?.name).toBe('민수');
  });

  it('이름 가운데 연속 공백을 하나로 줄인다', async () => {
    const user = userEvent.setup();
    render(<ParticipantSection />);

    await addParticipant(user, '김   민수');

    expect(participantsInStore()[0]?.name).toBe('김 민수');
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

  it('공백과 대소문자만 다른 이름도 중복으로 본다', async () => {
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
