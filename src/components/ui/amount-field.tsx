import { type ChangeEvent, type InputHTMLAttributes, useId, useState } from 'react';

import { cn } from '@/lib/cn';
import { formatAmount, hasDigit, parseAmount } from '@/lib/format';

type OmittedProps = 'id' | 'value' | 'defaultValue' | 'onChange' | 'type';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, OmittedProps> {
  label: string;
  isLabelHidden?: boolean;
  /** 정수 원 단위. */
  value: number;
  onValueChange: (won: number) => void;
}

/**
 * 금액 입력칸.
 *
 * 보이는 값은 항상 쉼표가 들어간 형태고, 밖으로 나가는 값은 항상 정수 원이다.
 * `type="number"` 를 쓰지 않는다. 쉼표를 넣을 수 없고, 모바일에서 스텝 화살표가
 * 붙는 데다, 브라우저가 지수 표기(`1e5`)를 유효한 값으로 받아준다.
 *
 * 0 과 "비어 있음"은 다르다. `value` 가 0 이어도 사용자가 지운 상태면 빈 칸으로
 * 두어야 한다. 0 을 그대로 그리면 지우자마자 "0" 이 다시 나타나 지워지지 않는 것처럼
 * 보인다.
 */
const AmountField = ({
  label,
  isLabelHidden = false,
  value,
  onValueChange,
  className,
  ...props
}: Props) => {
  const inputId = useId();
  const unitId = `${inputId}-unit`;
  const [isCleared, setIsCleared] = useState(value === 0);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = parseAmount(event.target.value);

    setIsCleared(!hasDigit(event.target.value));
    onValueChange(next);
  };

  const displayValue = isCleared && value === 0 ? '' : formatAmount(value);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className={cn('text-on-surface-muted text-sm font-medium', isLabelHidden && 'sr-only')}
      >
        {label}
      </label>

      <div
        className={cn(
          'bg-surface-raised border-outline-base focus-ring-within flex h-12 items-center rounded-xl border pr-4',
          className,
        )}
      >
        <input
          id={inputId}
          type="text"
          // 모바일에서 숫자 키패드를 띄우되 스텝 화살표는 붙이지 않는다
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleAmountChange}
          aria-describedby={unitId}
          className="tabular text-on-surface-base placeholder:text-on-surface-faint h-full w-full rounded-xl bg-transparent px-4 text-right text-base outline-none"
          {...props}
        />
        {/* 단위는 눈으로도 보이고 스크린리더로도 읽혀야 한다. 입력칸 밖이라 aria-describedby 로 묶는다 */}
        <span id={unitId} className="text-on-surface-muted pl-2 text-sm">
          원
        </span>
      </div>
    </div>
  );
};

export default AmountField;
