import { SlidersHorizontal } from 'lucide-react';

import AmountField from '@/components/ui/amount-field';
import Button from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import { ITEMS_TEXT } from '@/constants/text/items';
import { describeItem } from '@/lib/items/describe-item';
import type { ItemNotice } from '@/types/items';
import type { Item, Participant } from '@/types/settlement';

const { summary: SUMMARY_TEXT } = ITEMS_TEXT;

interface Props {
  item: Item;
  participants: Participant[];
  onNameChange: (itemId: string, name: string) => void;
  onAmountChange: (itemId: string, amount: number) => void;
  onOpenDetail: (itemId: string) => void;
}

const describeNotice = (notice: ItemNotice): string => {
  switch (notice.kind) {
    case 'payer':
      return SUMMARY_TEXT.payer(notice.participantName);
    case 'no-payer':
      return SUMMARY_TEXT.noPayer;
    case 'payer-only':
      return SUMMARY_TEXT.payerOnly;
    case 'partial':
      return SUMMARY_TEXT.partial(notice.participantCount);
    case 'full-charge':
      return SUMMARY_TEXT.full(notice.participantName);
    default:
      return SUMMARY_TEXT.amount(notice.participantName, notice.value);
  }
};

/**
 * 항목 한 줄. 기획설계 5.3
 *
 * 이름과 금액만 행에서 바로 고친다. 결제자·부담자·추가 부담은 상세 시트가 맡는다. 기획설계 5.4
 * 대부분의 항목은 전원이 똑같이 나누므로, 자주 쓰는 두 필드만 꺼내 두면 상세를 열 일이
 * 거의 없다.
 *
 * `<fieldset>` 으로 묶고 항목 이름을 `<legend>` 로 준다. 라벨이 "항목 이름"·"금액" 으로
 * 모든 행에서 같아서, 묶음 이름이 없으면 스크린리더로 훑을 때 지금 몇 번째 항목인지 알 수
 * 없다. 눈으로는 이미 입력칸 안에 이름이 보이므로 `sr-only` 로 감춘다.
 *
 * 요약줄은 결제자를 항상 적고, 나머지는 기본값에서 벗어난 것만 적는다. 결제자를 여기
 * 두지 않으면 목록만 보고 "이거 누가 냈더라" 를 풀 길이 상세 시트뿐이다.
 *
 * 상세는 행 전체를 누르는 대신 버튼 하나로 연다. 행 안에 입력칸이 두 개라서 행 탭과
 * 입력 포커스가 같은 제스처를 두고 부딪힌다.
 *
 * 삭제는 상세 시트로 내려보냈다. 360px 폭에서 이름·금액·상세·삭제를 한 줄에 놓으면 이름
 * 칸이 40px 까지 밀려 글자가 보이지 않는다. 참여자도 칩을 눌러 연 시트에서 지운다.
 *
 * `min-w-0` 은 flex 항목의 기본 `min-width: auto` 를 푼다. 그대로 두면 입력칸이 고유
 * 너비 아래로 줄지 않아 행이 화면 밖으로 나간다.
 */
const ItemRow = ({ item, participants, onNameChange, onAmountChange, onOpenDetail }: Props) => {
  const notices = describeItem(item, participants);

  return (
    <li>
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">{ITEMS_TEXT.rowLabel(item.name)}</legend>

        <div className="flex items-center gap-2">
          <TextField
            label={ITEMS_TEXT.nameLabel}
            isLabelHidden
            placeholder={ITEMS_TEXT.namePlaceholder}
            value={item.name}
            onChange={(event) => onNameChange(item.id, event.target.value)}
            autoComplete="off"
            className="min-w-0 flex-1"
          />

          {/* "원" 은 숨긴다. 좁은 행에서 단위가 자릿수를 밀어내는데, 합계에 원이 붙어 있고
              숫자만 있어도 금액인 게 분명하다. 폭은 백만 단위까지 한눈에 들어가게 잡았고,
              그보다 큰 금액은 칸 안에서 스크롤된다 */}
          <AmountField
            label={ITEMS_TEXT.amountLabel}
            isLabelHidden
            isUnitHidden
            value={item.amount}
            onValueChange={(amount) => onAmountChange(item.id, amount)}
            className="w-32 shrink-0"
          />

          {/* 버튼 목록만 따로 탐색하는 스크린리더 사용자도 대상을 구분하도록 항목 이름을 넣는다 */}
          <Button
            isIconOnly
            variant="ghost"
            aria-label={ITEMS_TEXT.detail.openAction(ITEMS_TEXT.rowLabel(item.name))}
            onClick={() => onOpenDetail(item.id)}
            className="shrink-0"
          >
            <SlidersHorizontal size={18} aria-hidden />
          </Button>
        </div>

        {notices.length > 0 && (
          <p className="text-on-surface-muted pl-1 text-xs">
            {notices.map(describeNotice).join(' · ')}
          </p>
        )}
      </fieldset>
    </li>
  );
};

export default ItemRow;
