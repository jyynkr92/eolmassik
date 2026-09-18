import { Trash2 } from 'lucide-react';

import AmountField from '@/components/ui/amount-field';
import Button from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import { ITEMS_TEXT } from '@/constants/text/items';
import { summarizeItem } from '@/lib/items/summarize-item';
import type { ItemSummary } from '@/lib/items/types';
import type { Item, Participant } from '@/types/settlement';

const { summary: SUMMARY_TEXT } = ITEMS_TEXT;

interface Props {
  item: Item;
  participants: Participant[];
  onNameChange: (itemId: string, name: string) => void;
  onAmountChange: (itemId: string, amount: number) => void;
  onRemove: (itemId: string) => void;
}

/**
 * 요약 한 줄을 만든다. 기본값 그대로면 `null` 이라 아무것도 그리지 않는다.
 *
 * 기본값은 "참여자 전원이 추가 부담 없이 똑같이 나눔" 이다. 여기서 벗어난 것만 적는다.
 */
const describeSummary = (
  { participantCount, charges }: ItemSummary,
  totalParticipants: number,
): string | null => {
  if (participantCount === 0) return SUMMARY_TEXT.noParticipants;

  const chargeLabels = charges.map((charge) =>
    charge.type === 'full'
      ? SUMMARY_TEXT.full(charge.participantName)
      : SUMMARY_TEXT.amount(charge.participantName, charge.value),
  );

  const labels =
    participantCount < totalParticipants
      ? [SUMMARY_TEXT.partial(participantCount), ...chargeLabels]
      : chargeLabels;
  if (labels.length === 0) return null;

  return labels.join(' · ');
};

/**
 * 항목 한 줄. 기획설계 5.3
 *
 * 이름과 금액만 행에서 바로 고친다. 결제자·부담자·추가 부담은 상세 시트가 맡는다.
 * 대부분의 항목은 전원이 똑같이 나누므로, 자주 쓰는 두 필드만 꺼내 두면 상세를 열 일이
 * 거의 없다.
 *
 * 이름·금액·삭제를 한 줄에 둔다. 요약은 예외인 항목에만 붙으므로, 대부분의 항목이
 * 한 줄로 끝난다. 목록을 훑을 때 화면에 들어오는 항목 수가 두 배가 된다.
 *
 * `min-w-0` 은 flex 항목의 기본 `min-width: auto` 를 푼다. 그대로 두면 입력칸이 고유
 * 너비 아래로 줄지 않아 행이 화면 밖으로 나간다.
 */
const ItemRow = ({ item, participants, onNameChange, onAmountChange, onRemove }: Props) => {
  const summary = describeSummary(summarizeItem(item, participants), participants.length);

  return (
    <li className="flex flex-col gap-1">
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
            숫자만 있어도 금액인 게 분명하다. 폭은 100만원대까지 들어가게 잡았다 */}
        <AmountField
          label={ITEMS_TEXT.amountLabel}
          isLabelHidden
          isUnitHidden
          value={item.amount}
          onValueChange={(amount) => onAmountChange(item.id, amount)}
          className="w-32 shrink-0"
        />

        <Button
          isIconOnly
          variant="ghost"
          aria-label={ITEMS_TEXT.removeAction(item.name)}
          onClick={() => onRemove(item.id)}
          className="shrink-0"
        >
          <Trash2 size={18} aria-hidden />
        </Button>
      </div>

      {/* 5.4 에서 상세 시트가 붙으면 이 줄이 시트를 여는 버튼이 된다 */}
      {summary !== null && <p className="text-on-surface-muted pl-1 text-xs">{summary}</p>}
    </li>
  );
};

export default ItemRow;
