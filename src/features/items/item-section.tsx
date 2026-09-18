import { Plus } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { ITEMS_TEXT } from '@/constants/text/items';
import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { hasPayer } from '@/lib/items/has-payer';
import { useSettlementActions, useSettlementStore } from '@/store/settlement-store';

import ItemDetailSheet from './item-detail-sheet';
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
  const options = useSettlementStore((state) => state.settlement.options);
  const defaultPayerId = useSettlementStore((state) => state.settlement.defaultPayerId);
  const {
    addItem,
    applyDefaultPayer,
    updateItem,
    removeItem,
    toggleItemParticipant,
    setExtraCharge,
    removeExtraCharge,
  } = useSettlementActions();

  /**
   * 상세 시트를 연 항목. 닫은 뒤에도 남겨 둬야 내려가는 애니메이션이 그려진다.
   *
   * 항목 객체가 아니라 id 로 들고 있다가 매번 찾는다. 시트는 초안을 두지 않고 스토어에
   * 바로 쓰므로, 스냅샷을 들면 시트 안에서 고친 값이 그 시트에 되돌아오지 않는다.
   */
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // NOTE: 같은 항목을 다시 열어도 삭제 확인과 펼침 상태를 초기화한다.
  const [openSeq, setOpenSeq] = useState(0);

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

  const handleOpenDetail = (itemId: string) => {
    setSelectedItemId(itemId);
    setOpenSeq((seq) => seq + 1);
    setIsSheetOpen(true);
  };

  const handlePayerChange = (itemId: string, payerId: string) => {
    updateItem(itemId, { payerId });
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

  const selectedItem = items.find((item) => item.id === selectedItemId);

  /**
   * 기본 결제자. 빠진 항목을 한 번에 되살리는 버튼에 이름으로 쓴다.
   *
   * 지금까지 이 값은 화면 어디에도 드러나지 않았다. 처음 추가한 참여자로 조용히 정해지고,
   * 그 사람을 지우면 남은 첫 참여자로 옮겨간다. 버튼 문구에 이름을 넣어 누가 들어올지
   * 누르기 전에 보이게 한다.
   */
  const defaultPayer = participants.find((participant) => participant.id === defaultPayerId);

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
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </ul>
      )}

      {!hasItems && hasParticipants && (
        <p className="text-on-surface-muted py-2 text-sm">{ITEMS_TEXT.empty}</p>
      )}

      <div className="flex flex-col gap-2">
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

        {/* 버튼이 왜 막혔는지는 항목이 있든 없든 알려야 한다. 참여자를 전부 지우면
            항목은 남아 있는데 버튼만 비활성이 되어 이유를 찾을 데가 없었다 */}
        {!hasParticipants && (
          <p className="text-on-surface-muted text-center text-xs">
            {ITEMS_TEXT.needsParticipants}
          </p>
        )}
      </div>

      {selectedItem && (
        <ItemDetailSheet
          key={openSeq}
          item={selectedItem}
          participants={participants}
          options={options}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onPayerChange={handlePayerChange}
          onParticipantToggle={toggleItemParticipant}
          onExtraChargeChange={setExtraCharge}
          onExtraChargeRemove={removeExtraCharge}
          onRemove={removeItem}
        />
      )}

      {hasItems && (
        <div className="border-outline-base flex flex-col border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-muted text-sm">{ITEMS_TEXT.totalLabel}</span>
            <span className="tabular text-on-surface-base text-base font-semibold">
              {formatWon(totalAmount)}
            </span>
          </div>

          {/* 비어 있어도 DOM 에 남겨 둔다. 라이브 영역은 내용이 바뀌기 전부터 자리에 있어야
              스크린리더가 변화를 읽는다 */}
          <p role="status" className={cn('text-danger-text text-xs', excludedCount > 0 && 'mt-2')}>
            {excludedCount > 0 ? ITEMS_TEXT.excludedNotice(excludedCount) : ''}
          </p>

          {/* 알림 바로 아래에 해결 수단을 둔다. 이미 결제자가 있는 항목은 건드리지 않는다 */}
          {excludedCount > 0 && defaultPayer && (
            <Button variant="soft" isFullWidth onClick={applyDefaultPayer} className="mt-3">
              {ITEMS_TEXT.applyDefaultPayerAction(defaultPayer.name)}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ItemSection;
