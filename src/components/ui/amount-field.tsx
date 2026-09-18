import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { COMMON_TEXT } from '@/constants/text/common';
import { cn } from '@/lib/cn';
import { countDigits, formatAmount, hasDigit, isAmountClamped, parseAmount } from '@/lib/format';

type OmittedProps = 'id' | 'value' | 'defaultValue' | 'onChange' | 'type';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, OmittedProps> {
  label: string;
  isLabelHidden?: boolean;
  /**
   * "원" 표기를 화면에서만 숨긴다. 스크린리더에는 그대로 읽힌다.
   *
   * 좁은 행 안에서는 단위가 자릿수를 밀어낸다. 금액인 게 자명한 자리라면 숨겨서
   * 숫자에 폭을 몰아주는 편이 낫다.
   */
  isUnitHidden?: boolean;
  /** 정수 원 단위. */
  value: number;
  onValueChange: (won: number) => void;
}

/**
 * 포맷된 문자열에서 앞쪽 숫자를 `digitCount` 개 지난 위치.
 *
 * 쉼표가 들어가고 빠지면서 문자열 길이가 바뀌므로, 캐럿 위치를 글자 수가 아니라
 * "앞에 숫자가 몇 개 있었는지"로 기억했다가 되찾는다.
 */
const findCaretAfterDigits = (text: string, digitCount: number): number => {
  if (digitCount === 0) return 0;

  let seen = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (hasDigit(text.charAt(index))) seen += 1;
    if (seen === digitCount) return index + 1;
  }

  return text.length;
};

/**
 * 금액 입력칸.
 *
 * 보이는 값은 항상 쉼표가 들어간 형태고, 밖으로 나가는 값은 항상 정수 원이다.
 * `type="number"` 를 쓰지 않는다. 쉼표를 넣을 수 없고, 모바일에서 스텝 화살표가
 * 붙는 데다, 브라우저가 지수 표기(`1e5`)를 유효한 값으로 받아준다.
 *
 * 0 과 "비어 있음"은 다르다. `value` 가 0 이어도 사용자가 지운 상태면 빈 칸으로
 * 두어야 한다. 0 을 그대로 그리면 지우자마자 "0" 이 다시 나타나 지워지지 않는 것처럼
 * 보인다. 이 구분은 "사용자가 0 을 직접 쳤는가"(`hasTypedZero`) 하나로 판단한다.
 * 마운트 시점의 값을 기억해 두면 부모가 값을 되돌렸을 때 판단이 어긋난다.
 */
const AmountField = ({
  label,
  isLabelHidden = false,
  isUnitHidden = false,
  value,
  onValueChange,
  className,
  'aria-describedby': describedByProp,
  ...props
}: Props) => {
  const inputId = useId();
  const unitId = `${inputId}-unit`;
  const noticeId = `${inputId}-notice`;

  const inputRef = useRef<HTMLInputElement>(null);
  /** 다음 렌더에서 되돌릴 캐럿 위치. 사용자가 입력했을 때만 채워진다. */
  const pendingCaretRef = useRef<number | null>(null);

  const [hasTypedZero, setHasTypedZero] = useState(false);
  const [isMaxReached, setIsMaxReached] = useState(false);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const caret = event.target.selectionStart ?? raw.length;

    pendingCaretRef.current = countDigits(raw.slice(0, caret));

    const next = parseAmount(raw);

    setHasTypedZero(hasDigit(raw) && next === 0);
    setIsMaxReached(isAmountClamped(raw));
    onValueChange(next);
  };

  // 값을 다시 포맷해 그리면 브라우저가 캐럿을 끝으로 보낸다. 문자열 중간을 고칠 때
  // 커서가 튀지 않도록, 그린 직후에 원래 자리로 되돌린다.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const digitCount = pendingCaretRef.current;
    if (input === null || digitCount === null) return;

    pendingCaretRef.current = null;

    const caret = findCaretAfterDigits(input.value, digitCount);
    input.setSelectionRange(caret, caret);
  });

  const displayValue = value === 0 && !hasTypedZero ? '' : formatAmount(value);
  const describedBy = [unitId, isMaxReached ? noticeId : null, describedByProp]
    .filter((id) => id !== null && id !== undefined)
    .join(' ');

  return (
    <div className={cn('flex flex-col', className)}>
      <label
        htmlFor={inputId}
        className={cn('text-on-surface-muted text-sm font-medium', isLabelHidden && 'sr-only')}
      >
        {label}
      </label>

      {/*
        라벨과의 간격은 라벨이 보일 때만 준다. `sr-only` 라벨은 absolute 라 자리를 차지하지
        않는데 margin 만 남으면, 같은 행의 다른 입력칸보다 이 칸만 8px 내려가 앉는다.
      */}
      <div
        className={cn(
          'bg-surface-raised border-outline-base focus-ring-within flex h-12 items-center rounded-xl border',
          !isLabelHidden && 'mt-2',
          !isUnitHidden && 'pr-4',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          // 모바일에서 숫자 키패드를 띄우되 스텝 화살표는 붙이지 않는다
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleAmountChange}
          aria-describedby={describedBy}
          className="tabular text-on-surface-base placeholder:text-on-surface-faint h-full w-full rounded-xl bg-transparent px-4 text-right text-base outline-none"
          {...props}
        />
        {/* 단위는 눈으로도 보이고 스크린리더로도 읽혀야 한다. 입력칸 밖이라 aria-describedby 로 묶는다 */}
        <span
          id={unitId}
          className={cn('text-on-surface-muted text-sm', isUnitHidden ? 'sr-only' : 'pl-2')}
        >
          원
        </span>
      </div>

      {/*
        상한에서 잘렸다는 사실을 알려준다. 없으면 키가 안 먹는 것처럼 보인다.

        비어 있어도 DOM 에 남겨 둔다. 라이브 영역은 내용이 바뀌기 전부터 자리에 있어야
        스크린리더가 변화를 읽는다. 알림이 뜨는 순간 요소째 나타나면 대부분 읽히지 않는다.
      */}
      <p
        id={noticeId}
        role="status"
        className={cn('text-on-surface-muted text-xs', isMaxReached && 'mt-2')}
      >
        {isMaxReached ? COMMON_TEXT.maxAmountReached : ''}
      </p>
    </div>
  );
};

export default AmountField;
