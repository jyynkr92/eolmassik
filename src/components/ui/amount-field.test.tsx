import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MAX_AMOUNT } from '@/constants/settlement';
import { COMMON_TEXT } from '@/constants/text/common';

import AmountField from './amount-field';

/** 실제 사용처처럼 부모가 값을 쥐고 있는 형태. */
const ControlledAmountField = ({ initial = 0 }: { initial?: number }) => {
  const [amount, setAmount] = useState(initial);

  return (
    <>
      <AmountField label="금액" value={amount} onValueChange={setAmount} />
      <button type="button" onClick={() => setAmount(0)}>
        초기화
      </button>
    </>
  );
};

const getInput = () => screen.getByLabelText<HTMLInputElement>('금액');

describe('AmountField', () => {
  it('0 원은 빈 칸으로 보여준다', () => {
    render(<AmountField label="금액" value={0} onValueChange={vi.fn()} />);

    expect(getInput()).toHaveValue('');
  });

  it('밖에서 들어온 금액에 쉼표를 넣어 보여준다', () => {
    render(<AmountField label="금액" value={32000} onValueChange={vi.fn()} />);

    expect(getInput()).toHaveValue('32,000');
  });

  it('사용자가 직접 친 0 은 빈 칸이 아니라 0 으로 남는다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField />);

    await user.type(getInput(), '0');

    expect(getInput()).toHaveValue('0');
  });

  it('지우면 0 을 내보내면서 빈 칸이 된다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField initial={32000} />);

    await user.clear(getInput());

    expect(getInput()).toHaveValue('');
  });

  // 회귀 방지: isCleared 를 마운트 시점 값으로만 잡으면 여기서 "0" 이 나온다
  it('부모가 값을 0 으로 되돌리면 다시 빈 칸이 된다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField initial={32000} />);

    await user.click(screen.getByRole('button', { name: '초기화' }));

    expect(getInput()).toHaveValue('');
  });

  it('문자열 중간에 숫자를 넣어도 캐럿이 끝으로 튀지 않는다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField initial={32000} />);

    const input = getInput();
    // "32,000" 에서 "3" 바로 뒤에 캐럿을 두고 "1" 을 친다
    await user.click(input);
    input.setSelectionRange(1, 1);
    await user.keyboard('1');

    expect(input).toHaveValue('312,000');
    // "31|2,000" — 방금 친 숫자 바로 뒤여야 한다
    expect(input.selectionStart).toBe(2);
  });

  it('상한을 넘겨 입력하면 잘라내고 이유를 알려준다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField />);

    await user.type(getInput(), '9999999999');

    expect(getInput()).toHaveValue('999,999,999');
    expect(screen.getByRole('status')).toHaveTextContent(COMMON_TEXT.maxAmountReached);
  });

  // 라이브 영역은 내용이 바뀌기 전부터 자리에 있어야 스크린리더가 변화를 읽는다
  it('상한 안에서는 안내 자리를 비워 둔다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountField />);

    await user.type(getInput(), `${MAX_AMOUNT}`);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('단위와 호출부가 넘긴 설명을 모두 연결한다', () => {
    render(
      <>
        <AmountField label="금액" value={0} onValueChange={vi.fn()} aria-describedby="outside" />
        <p id="outside">바깥 설명</p>
      </>,
    );

    expect(getInput()).toHaveAccessibleDescription(/원/);
    expect(getInput()).toHaveAccessibleDescription(/바깥 설명/);
  });
});
