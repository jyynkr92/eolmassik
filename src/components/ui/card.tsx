import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

interface Props {
  /** 섹션 제목. 넘기면 `aria-labelledby` 로 섹션과 묶인다. */
  title?: string;
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
const Card = ({ title, action, className, children }: Props) => {
  const titleId = useId();

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
          <h2 id={titleId} className="text-on-surface-base text-base font-semibold">
            {title}
          </h2>
          {action}
        </header>
      )}

      {children}
    </section>
  );
};

export default Card;
