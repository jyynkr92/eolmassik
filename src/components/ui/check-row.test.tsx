import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CheckRow from './check-row';

describe('CheckRow', () => {
  it('줄 전체가 체크박스로 읽히고 눌린다', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    render(<CheckRow isChecked={false} onCheckedChange={handleCheckedChange} label="민수" />);

    await user.click(screen.getByRole('checkbox', { name: /민수/ }));

    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('보조 정보도 체크박스 이름에 함께 읽힌다', () => {
    render(<CheckRow isChecked onCheckedChange={vi.fn()} label="민수" trailing="12,000원" />);

    expect(screen.getByRole('checkbox', { name: /민수.*12,000원/ })).toBeInTheDocument();
  });

  it('비활성이면 눌러도 값이 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();
    render(
      <CheckRow isChecked={false} onCheckedChange={handleCheckedChange} label="민수" isDisabled />,
    );

    await user.click(screen.getByRole('checkbox', { name: /민수/ }));

    expect(handleCheckedChange).not.toHaveBeenCalled();
  });
});
