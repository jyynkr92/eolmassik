import { type ComponentPropsWithRef, useId } from 'react';

import { cn } from '@/lib/cn';

interface Props extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
  label: string;
  /** 라벨을 화면에서 숨긴다. 자리가 없는 행 안에서도 스크린리더용 이름은 남긴다. */
  isLabelHidden?: boolean;
  /** 입력 방법을 설명하는 보조 문구. */
  description?: string;
  /** 오류 문구. 있으면 `aria-invalid` 가 함께 붙는다. */
  error?: string;
}

/**
 * 한 줄 텍스트 입력.
 *
 * 라벨·설명·오류를 `id` 로 묶는 일은 매번 똑같고 매번 빠뜨리기 쉬워서 여기서 처리한다.
 * placeholder 를 라벨 대신 쓰지 않는다. 입력을 시작하는 순간 사라져서 무엇을 적는
 * 칸이었는지 알 수 없게 된다.
 */
const TextField = ({
  label,
  isLabelHidden = false,
  description,
  error,
  className,
  'aria-describedby': describedByProp,
  ...props
}: Props) => {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  // 호출부가 넘긴 값도 함께 묶는다. 덮어쓰면 설명·오류 연결이 조용히 사라진다
  const describedBy = [description ? descriptionId : null, error ? errorId : null, describedByProp]
    .filter((id) => id !== null && id !== undefined)
    .join(' ');

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className={cn('text-on-surface-muted text-sm font-medium', isLabelHidden && 'sr-only')}
      >
        {label}
      </label>

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={cn(
          'focus-ring text-on-surface-base placeholder:text-on-surface-faint h-12 w-full rounded-xl px-4',
          'bg-surface-raised border-outline-base border transition-colors',
          // 모바일 사파리는 16px 미만 입력칸에 포커스가 가면 화면을 확대한다
          'text-base',
          'disabled:bg-surface-dim disabled:text-on-surface-faint',
          error && 'border-danger-line',
          className,
        )}
        {...props}
      />

      {description && (
        <p id={descriptionId} className="text-on-surface-faint text-xs">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-danger-text text-xs">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;
