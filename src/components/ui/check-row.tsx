import { Check } from 'lucide-react';
import { Checkbox } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface Props {
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  label: string;
  /** 이름 오른쪽 보조 정보. 부담액 미리보기처럼 쓴다. */
  trailing?: ReactNode;
  isDisabled?: boolean;
}

/**
 * 체크박스 한 줄. 항목의 부담자 토글에 쓴다. 기획설계 5.4
 *
 * 줄 전체가 눌리는 영역이다. 체크박스만 눌러야 하면 모바일에서 조준이 필요해진다.
 * `Checkbox.Root` 를 라벨로 감싸는 대신 Radix 가 만들어 주는 버튼 자체를 줄 크기로
 * 키워, 눌리는 영역과 포커스 영역이 어긋나지 않게 했다.
 */
const CheckRow = ({ isChecked, onCheckedChange, label, trailing, isDisabled }: Props) => {
  return (
    <Checkbox.Root
      checked={isChecked}
      onCheckedChange={(checked) => onCheckedChange(checked === true)}
      disabled={isDisabled}
      className={cn(
        'focus-ring flex min-h-12 w-full items-center gap-4 rounded-xl px-2 text-left transition-colors',
        // 행은 줄이지 않는다. 목록 안에서 한 줄만 작아지면 나머지가 출렁이는 것처럼 보인다
        'hover:bg-surface-dim pointer-fine:active:bg-surface-inset',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors',
          isChecked
            ? 'bg-accent-solid border-accent-solid text-accent-on'
            : 'border-outline-strong bg-surface-raised',
        )}
      >
        {isChecked && <Check size={16} strokeWidth={3} />}
      </span>

      <span className="text-on-surface-base flex-1 text-sm font-medium">{label}</span>
      {trailing}
    </Checkbox.Root>
  );
};

export default CheckRow;
