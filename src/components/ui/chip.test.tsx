import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Chip from './chip';

describe('Chip', () => {
  it('선택 상태를 aria-pressed 로 알린다', () => {
    render(<Chip isSelected>민수</Chip>);

    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });

  it('토글이 아니면 aria-pressed 를 붙이지 않는다', () => {
    render(<Chip>민수</Chip>);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });

  // 회귀 방지: 색만으로 선택을 알리면 색각 이상 사용자가 구분하지 못한다
  it('선택되면 색 말고 아이콘으로도 표시한다', () => {
    const { container, rerender } = render(<Chip>민수</Chip>);

    expect(container.querySelector('svg')).toBeNull();

    rerender(<Chip isSelected>민수</Chip>);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('폼 안에서도 제출 버튼이 되지 않는다', () => {
    render(<Chip>민수</Chip>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
