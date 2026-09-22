import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ConfirmActions from './confirm-actions';

describe('ConfirmActions', () => {
  it('취소와 실행을 각각 알린다', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleConfirm = vi.fn();
    render(<ConfirmActions onCancel={handleCancel} onConfirm={handleConfirm} />);

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(handleCancel).toHaveBeenCalledOnce();
    expect(handleConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  // 화면이 바뀐 것을 스크린리더가 그 순간 읽어야 한다
  it('취소 버튼으로 포커스를 옮긴다', () => {
    render(<ConfirmActions onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });
});
