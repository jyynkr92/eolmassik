import { Plus } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { ITEMS_TEXT } from '@/constants/text/items';
import { formatWon } from '@/lib/format';
import { hasPayer } from '@/lib/items/has-payer';
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

  /**
   * 입력이 바뀔 때마다 스토어에 쓴다. persist 가 동기로 localStorage 에 쓰므로 키 입력마다
   * 직렬화가 일어나지만, 이 초안은 작성이 끝나면 버려지는 데이터이고 새로고침 복구가
   * 그보다 중요하다. 항목 이름·금액은 검증이 없어 중간값이 남아도 해가 없다.
   */
  const handleNameChange = (itemId: string, name: string) => {
    updateItem(itemId, { name });
  };

  const handleAmountChange = (itemId: string, amount: number) => {
    updateItem(itemId, { amount });
  };

  const hasParticipants = participants.length > 0;
  const hasItems = items.length > 0;

  /**
   * 합계는 정산에 실제로 반영될 항목만 더한다.
   *
   * 결제자가 없는 항목은 `calculateSettlement` 이 통째로 빼므로, 그것까지 더하면 화면의
   * 합계와 실제 정산 금액이 어긋난다. 빠진 항목이 있다는 사실은 아래에서 따로 알린다.
   */
  const settleableItems = items.filter((item) => hasPayer(item, participants));
  const totalAmount = settleableItems.reduce((sum, item) => sum + item.amount, 0);
  const excludedCount = items.length - settleableItems.length;

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
        <div className="border-outline-base flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-muted text-sm">{ITEMS_TEXT.totalLabel}</span>
            <span className="tabular text-on-surface-base text-base font-semibold">
              {formatWon(totalAmount)}
            </span>
          </div>

          {excludedCount > 0 && (
            <p role="status" className="text-danger-text text-xs">
              {ITEMS_TEXT.excludedNotice(excludedCount)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default ItemSection;
