import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

type HeadingLevel = 2 | 3;

interface Props {
  /** 섹션 제목. 넘기면 `aria-labelledby` 로 섹션과 묶인다. */
  title?: string;
  /** 제목 앞에 붙는 장식 아이콘. 접근성 이름에는 제목만 남긴다. */
  titleIcon?: ReactNode;
  /**
   * 제목의 헤딩 레벨. 기본은 페이지 `h1` 바로 아래인 2다.
   * 시트 안이나 카드 안에 다시 놓일 때 3으로 내려 헤딩 순서가 어긋나지 않게 한다.
   */
  headingLevel?: HeadingLevel;
  /** 제목 오른쪽 영역. "추가" 버튼 자리다. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * 화면을 나누는 기본 블록.
 *
 * 그림자 대신 얇은 테두리로 층을 만든다. 모바일에서 카드가 세로로 이어질 때
 * 그림자가 겹치면 화면이 탁해 보인다.
 */
const Card = ({ title, titleIcon, headingLevel = 2, action, className, children }: Props) => {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'bg-surface-raised border-outline-base flex flex-col gap-4 rounded-2xl border p-4',
        className,
      )}
    >
      {title && (
        <header className="flex items-center justify-between gap-2">
          <Heading
            id={titleId}
            className="text-on-surface-base flex items-center gap-2 text-base font-semibold"
          >
            {titleIcon && (
              <span aria-hidden="true" className="text-accent-text shrink-0">
                {titleIcon}
              </span>
            )}
            {title}
          </Heading>
          {action}
        </header>
      )}

      {children}
    </section>
  );
};

export default Card;
