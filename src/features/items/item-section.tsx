import { Plus } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { ITEMS_TEXT } from '@/constants/text/items';
import { formatWon } from '@/lib/format';
import { useSettlementActions, useSettlementStore } from '@/store/settlement-store';

import ItemRow from './item-row';

/**
 * [3] 항목 입력. 기획설계 5.3
 *
 * 참여자가 없으면 항목을 만들 수 없다. 신규 항목은 결제자를 기본 결제자로, 부담자를
 * 전원으로 채우는데(기획설계 9 — 결정 기록 7), 참여자가 하나도 없으면 결제자 없는 항목이
 * 되어 정산에서 통째로 빠진다. 만들 수 있게 두고 나중에 "이 항목은 계산에서 빠졌어요" 라고
 * 알리는 것보다, 만들기 전에 막는 쪽이 설명할 것이 적다.
 */
const ItemSection = () => {
  const items = useSettlementStore((state) => state.settlement.items);
  const participants = useSettlementStore((state) => state.settlement.participants);
  const { addItem, updateItem, removeItem } = useSettlementActions();

  const handleNameChange = (itemId: string, name: string) => {
    updateItem(itemId, { name });
  };

  const handleAmountChange = (itemId: string, amount: number) => {
    updateItem(itemId, { amount });
  };

  const hasParticipants = participants.length > 0;
  const hasItems = items.length > 0;
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card
      title={ITEMS_TEXT.title}
      action={
        hasItems && (
          <span className="tabular text-on-surface-muted text-sm">
            {ITEMS_TEXT.count(items.length)}
          </span>
        )
      }
    >
      {hasItems && (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              participants={participants}
              onNameChange={handleNameChange}
              onAmountChange={handleAmountChange}
              onRemove={removeItem}
            />
          ))}
        </ul>
      )}

      {!hasItems && (
        <p className="text-on-surface-muted py-2 text-sm">
          {hasParticipants ? ITEMS_TEXT.empty : ITEMS_TEXT.needsParticipants}
        </p>
      )}

      <Button
        variant="soft"
        size="lg"
        isFullWidth
        disabled={!hasParticipants}
        leadingIcon={<Plus size={18} aria-hidden />}
        onClick={() => addItem()}
      >
        {ITEMS_TEXT.addAction}
      </Button>

      {hasItems && (
        <div className="border-outline-base flex items-center justify-between border-t pt-3">
          <span className="text-on-surface-muted text-sm">{ITEMS_TEXT.totalLabel}</span>
          <span className="tabular text-on-surface-base text-base font-semibold">
            {formatWon(totalAmount)}
          </span>
        </div>
      )}
    </Card>
  );
};

export default ItemSection;
