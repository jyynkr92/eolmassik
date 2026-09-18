import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';

import AmountField from '@/components/ui/amount-field';
import Button from '@/components/ui/button';
import CheckRow from '@/components/ui/check-row';
import Chip from '@/components/ui/chip';
import ConfirmActions from '@/components/ui/confirm-actions';
import Sheet from '@/components/ui/sheet';
import { COMMON_TEXT } from '@/constants/text/common';
import { ITEMS_TEXT } from '@/constants/text/items';
import { calculateItem } from '@/lib/calc';
import { formatWon } from '@/lib/format';
import { hasPayer } from '@/lib/items/has-payer';
import type { ExtraCharge, Item, Options, Participant } from '@/types/settlement';

const { detail: DETAIL_TEXT } = ITEMS_TEXT;

interface Props {
  item: Item;
  participants: Participant[];
  /** 부담액 미리보기를 결과 화면과 같은 규칙으로 계산하려면 옵션이 필요하다. */
  options: Options;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPayerChange: (itemId: string, payerId: string) => void;
  onParticipantToggle: (itemId: string, participantId: string) => void;
  onExtraChargeChange: (itemId: string, charge: ExtraCharge) => void;
  onExtraChargeRemove: (itemId: string, participantId: string) => void;
  onRemove: (itemId: string) => void;
}

/**
 * [3-1] 항목 상세. 기획설계 5.4
 *
 * 결제자 · 부담자 · 추가 부담 세 가지를 받는다. 결제자가 여기 있는 이유는 결제자 없는
 * 항목이 정산에서 통째로 빠지는데, 그걸 되돌릴 화면이 여기밖에 없기 때문이다.
 *
 * **로컬 초안을 두지 않고 스토어에 바로 쓴다.** 참여자 이름과 달리 여기 있는 입력은
 * 거부될 값이 없어서 중간값이 남아도 해가 없고, 무엇보다 화면 오른쪽의 부담액
 * 미리보기가 스토어의 항목을 그대로 `calculateItem` 에 넣어 그린다. 초안을 따로 들면
 * 미리보기가 초안과 스토어 중 어느 쪽을 봐야 하는지부터 갈린다.
 *
 * 그래서 미리보기는 결과 화면과 **같은 함수**를 쓴다. 여기서 본 금액과 정산 결과가
 * 다르면 어느 쪽을 믿어야 할지 알 수 없다.
 *
 * 삭제는 되돌릴 수 없어서 한 화면을 더 거친다. 시트를 하나 더 겹쳐 띄우는 대신 이 시트가
 * 통째로 확인 화면이 되고, 좌상단 뒤로 가기나 취소로 돌아온다.
 *
 * 추가 부담은 사람 목록을 따로 만들지 않고 부담자 행에서 바로 펼친다. "누가 더 낼래?"
 * → 사람 고르기 단계를 없애면 탭이 한 번 줄고, 부담 여부와 추가 부담을 한 줄에서 본다.
 */
const ItemDetailSheet = ({
  item,
  participants,
  options,
  isOpen,
  onOpenChange,
  onPayerChange,
  onParticipantToggle,
  onExtraChargeChange,
  onExtraChargeRemove,
  onRemove,
}: Props) => {
  const panelId = useId();
  /** 삭제 확인 화면을 보고 있는지. 시트를 겹치지 않고 이 시트의 내용을 갈아 끼운다. */
  const [isRemoveConfirming, setIsRemoveConfirming] = useState(false);

  const { shares } = calculateItem(item, participants, options);
  const shareById = new Map(shares.map((share) => [share.participantId, share.amount]));
  const chargeById = new Map(item.extraCharges.map((charge) => [charge.participantId, charge]));
  const bearerIds = new Set(item.participantIds);

  /**
   * 추가 부담을 넣거나 뺀다. 넣을 때는 0원으로 시작한다.
   *
   * 0원 부담은 요약줄에도 계산에도 잡히지 않아서, 펼쳐만 두고 금액을 안 넣은 상태가
   * 아무것도 안 한 것과 같아진다. 펼침 상태를 따로 기억하지 않아도 되는 이유다.
   */
  const handleExtraChargeToggle = (participantId: string) => {
    if (chargeById.has(participantId)) {
      onExtraChargeRemove(item.id, participantId);
      return;
    }

    onExtraChargeChange(item.id, { participantId, type: 'amount', value: 0 });
  };

  const handleFullChargeToggle = (charge: ExtraCharge) => {
    const next: ExtraCharge =
      charge.type === 'full'
        ? { participantId: charge.participantId, type: 'amount', value: 0 }
        : { participantId: charge.participantId, type: 'full' };

    onExtraChargeChange(item.id, next);
  };

  const handleChargeAmountChange = (participantId: string, value: number) => {
    onExtraChargeChange(item.id, { participantId, type: 'amount', value });
  };

  const handleRemove = () => {
    onRemove(item.id);
    onOpenChange(false);
  };

  const itemLabel = ITEMS_TEXT.rowLabel(item.name);

  if (isRemoveConfirming) {
    return (
      <Sheet
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={DETAIL_TEXT.removeConfirmTitle(itemLabel)}
        description={COMMON_TEXT.removeWarning}
        onBack={() => setIsRemoveConfirming(false)}
        footer={
          <ConfirmActions onCancel={() => setIsRemoveConfirming(false)} onConfirm={handleRemove} />
        }
      >
        <p className="text-on-surface-muted text-sm">{DETAIL_TEXT.removeConfirmBody}</p>
      </Sheet>
    );
  }

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={DETAIL_TEXT.title(itemLabel)}
      description={DETAIL_TEXT.description(item.amount)}
      footer={
        <Button size="lg" isFullWidth onClick={() => onOpenChange(false)}>
          {COMMON_TEXT.apply}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* 칩 묶음의 이름을 legend 로 준다. 칩만 늘어서 있으면 무엇을 고르는 줄인지 알 수 없다 */}
        <fieldset>
          <legend className="text-on-surface-muted text-sm font-medium">
            {DETAIL_TEXT.payerLabel}
          </legend>

          <ul className="mt-2 flex flex-wrap gap-2">
            {participants.map((participant) => (
              <li key={participant.id}>
                <Chip
                  isSelected={participant.id === item.payerId}
                  onClick={() => onPayerChange(item.id, participant.id)}
                >
                  {participant.name}
                </Chip>
              </li>
            ))}
          </ul>

          <p className="text-on-surface-muted mt-2 text-xs">
            {hasPayer(item, participants) ? DETAIL_TEXT.payerHint : DETAIL_TEXT.payerMissing}
          </p>
        </fieldset>

        <fieldset>
          <legend className="text-on-surface-muted text-sm font-medium">
            {DETAIL_TEXT.bearerLabel}
          </legend>

          <ul className="mt-2 flex flex-col gap-1">
            {participants.map((participant) => {
              const charge = chargeById.get(participant.id);
              const chargePanelId = `${panelId}-${participant.id}`;

              return (
                <li key={participant.id} className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <CheckRow
                      isChecked={bearerIds.has(participant.id)}
                      onCheckedChange={() => onParticipantToggle(item.id, participant.id)}
                      label={DETAIL_TEXT.bearerName(participant.name, participant.headcount)}
                      trailing={formatWon(shareById.get(participant.id) ?? 0)}
                      className="min-w-0 flex-1"
                    />

                    <Button
                      isIconOnly
                      variant="ghost"
                      aria-label={
                        charge
                          ? DETAIL_TEXT.extraChargeRemoveAction(participant.name)
                          : DETAIL_TEXT.extraChargeAction(participant.name)
                      }
                      aria-expanded={charge !== undefined}
                      {...(charge !== undefined && { 'aria-controls': chargePanelId })}
                      onClick={() => handleExtraChargeToggle(participant.id)}
                      className="shrink-0"
                    >
                      {charge ? <Minus size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
                    </Button>
                  </div>

                  {charge && (
                    <div id={chargePanelId} className="flex items-center gap-2 pr-1 pb-2 pl-10">
                      {/* 전액이면 금액은 항목 금액으로 고정이다. 칸을 숨기는 대신 잠가서
                          얼마를 지게 되는지 그대로 보여준다 */}
                      <AmountField
                        label={DETAIL_TEXT.extraChargeLabel(participant.name)}
                        isLabelHidden
                        placeholder={DETAIL_TEXT.extraChargePlaceholder}
                        value={charge.type === 'full' ? item.amount : (charge.value ?? 0)}
                        onValueChange={(value) => handleChargeAmountChange(participant.id, value)}
                        disabled={charge.type === 'full'}
                        className="min-w-0 flex-1"
                      />

                      <Chip
                        isSelected={charge.type === 'full'}
                        onClick={() => handleFullChargeToggle(charge)}
                        className="shrink-0"
                      >
                        {DETAIL_TEXT.fullChargeAction}
                      </Chip>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-on-surface-muted mt-2 text-xs">{DETAIL_TEXT.bearerHint}</p>
        </fieldset>

        {/* 행에 두면 이름 칸을 밀어내서 여기로 내렸다. 참여자도 시트에서 지운다 */}
        <Button variant="danger" size="lg" isFullWidth onClick={() => setIsRemoveConfirming(true)}>
          {DETAIL_TEXT.removeAction}
        </Button>
      </div>
    </Sheet>
  );
};

export default ItemDetailSheet;
