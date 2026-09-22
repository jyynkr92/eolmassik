import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Card from './card';

describe('Card', () => {
  it('제목을 h2 로 두고 섹션과 묶는다', () => {
    render(<Card title="참여자">내용</Card>);

    expect(screen.getByRole('heading', { level: 2, name: '참여자' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '참여자' })).toBeInTheDocument();
  });

  // 회귀 방지: 시트나 카드 안에 다시 놓일 때 헤딩 순서가 어긋나지 않아야 한다
  it('헤딩 레벨을 내릴 수 있다', () => {
    render(
      <Card title="항목" headingLevel={3}>
        내용
      </Card>,
    );

    expect(screen.getByRole('heading', { level: 3, name: '항목' })).toBeInTheDocument();
  });

  it('제목이 없으면 헤딩도 이름도 만들지 않는다', () => {
    render(<Card>내용</Card>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
