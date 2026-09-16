import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TextField from './text-field';

const getInput = () => screen.getByLabelText<HTMLInputElement>('이름');

describe('TextField', () => {
  it('라벨을 숨겨도 스크린리더용 이름은 남는다', () => {
    render(<TextField label="이름" isLabelHidden />);

    expect(getInput()).toBeInTheDocument();
  });

  it('설명과 오류를 입력칸에 연결한다', () => {
    render(<TextField label="이름" description="최대 10자" error="이미 있는 이름이에요" />);

    expect(getInput()).toHaveAccessibleDescription(/최대 10자/);
    expect(getInput()).toHaveAccessibleDescription(/이미 있는 이름이에요/);
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('오류가 없으면 aria-invalid 를 붙이지 않는다', () => {
    render(<TextField label="이름" />);

    expect(getInput()).not.toHaveAttribute('aria-invalid');
  });

  // 회귀 방지: {...props} 가 뒤에 오면 호출부 값이 내부 연결을 덮어쓴다
  it('호출부가 넘긴 설명을 덮어쓰지 않고 함께 묶는다', () => {
    render(
      <>
        <TextField label="이름" description="최대 10자" aria-describedby="outside" />
        <p id="outside">바깥 설명</p>
      </>,
    );

    expect(getInput()).toHaveAccessibleDescription(/최대 10자/);
    expect(getInput()).toHaveAccessibleDescription(/바깥 설명/);
  });
});
