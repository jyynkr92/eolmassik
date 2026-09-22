import { LazyMotion } from 'framer-motion';
import { ArrowRight, List, ReceiptText, Send, UsersRound, Wallet } from 'lucide-react';
import type { RefObject } from 'react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { RESULT_TEXT } from '@/constants/text/result';
import ResultItemDetail from '@/features/result/result-item-detail';
import ShareActions from '@/features/share/share-actions';
import { calculateSettlement } from '@/lib/calc';
import { formatWon } from '@/lib/format';
import { useSettlementStore } from '@/store/settlement-store';
import type { Settlement } from '@/types/settlement';

const loadMotionFeatures = () =>
  import('./motion-features').then(({ default: features }) => features);

interface Props {
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onEdit?: () => void;
  settlement?: Settlement;
  isReadOnly?: boolean;
}

/** 입력된 원본과 계산 결과를 함께 보여준다. 금액은 스토어에 저장하지 않는다. */
const ResultSection = ({
  headingRef,
  onEdit,
  settlement: settlementOverride,
  isReadOnly = false,
}: Props) => {
  const storedSettlement = useSettlementStore((state) => state.settlement);
  const settlement = settlementOverride ?? storedSettlement;
  const result = calculateSettlement(settlement);
  const { participants, items } = settlement;
  const totalHeadcount = participants.reduce((sum, participant) => sum + participant.headcount, 0);
  const nameById = new Map(participants.map((participant) => [participant.id, participant.name]));
  const itemResultById = new Map(result.itemResults.map((item) => [item.itemId, item]));

  return (
    <section aria-label={RESULT_TEXT.pageLabel} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="result-heading"
          ref={headingRef}
          tabIndex={-1}
          className="focus-ring text-on-surface-base text-xl font-bold"
        >
          <ReceiptText
            size={22}
            aria-hidden
            className="text-accent-text mr-2 inline-block align-[-3px]"
          />
          {settlement.title.trim() || RESULT_TEXT.title}
        </h2>
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            {RESULT_TEXT.editAction}
          </Button>
        )}
      </div>

      <Card title={RESULT_TEXT.totalLabel} titleIcon={<Wallet size={18} />} headingLevel={3}>
        <strong className="tabular text-on-surface-base text-3xl">
          {formatWon(result.totalAmount)}
        </strong>
        <p className="text-on-surface-muted text-sm">
          {RESULT_TEXT.participantCount(totalHeadcount)} · {RESULT_TEXT.itemCount(items.length)}
        </p>
      </Card>

      <Card title={RESULT_TEXT.transferTitle} titleIcon={<Send size={18} />} headingLevel={3}>
        {result.transfers.length === 0 ? (
          <p className="text-on-surface-muted text-sm">{RESULT_TEXT.noTransfer}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {result.transfers.map((transfer) => (
              <li
                key={`${transfer.fromId}:${transfer.toId}`}
                className="border-outline-base flex flex-wrap items-baseline justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
              >
                <span className="text-on-surface-base font-medium">
                  <span className="sr-only">
                    {RESULT_TEXT.transfer(
                      nameById.get(transfer.fromId) ?? '',
                      nameById.get(transfer.toId) ?? '',
                    )}
                  </span>
                  <span aria-hidden className="inline-flex items-center gap-1">
                    {nameById.get(transfer.fromId)}
                    <ArrowRight size={16} className="text-on-surface-muted shrink-0" />
                    {nameById.get(transfer.toId)}
                  </span>
                </span>
                <strong className="tabular text-accent-text">{formatWon(transfer.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
        {result.roundingExcess > 0 && (
          <p className="text-on-surface-muted text-sm">
            {RESULT_TEXT.roundingExcess(result.roundingExcess)}
          </p>
        )}
      </Card>

      {!isReadOnly && <ShareActions settlement={settlement} result={result} />}

      <Card title={RESULT_TEXT.balanceTitle} titleIcon={<UsersRound size={18} />} headingLevel={3}>
        <ul className="divide-outline-base divide-y">
          {result.balances.map((balance) => (
            <li
              key={balance.participantId}
              className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-on-surface-base font-medium">
                {nameById.get(balance.participantId)}
              </span>
              <span className="tabular text-on-surface-muted text-right text-sm">
                {RESULT_TEXT.paidLabel} {formatWon(balance.paid)} · {RESULT_TEXT.owedLabel}{' '}
                {formatWon(balance.owed)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={RESULT_TEXT.detailTitle} titleIcon={<List size={18} />} headingLevel={3}>
        <LazyMotion features={loadMotionFeatures} strict>
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const itemResult = itemResultById.get(item.id);
              if (!itemResult) return null;

              return (
                <ResultItemDetail
                  key={item.id}
                  item={item}
                  itemResult={itemResult}
                  nameById={nameById}
                />
              );
            })}
          </ul>
        </LazyMotion>
      </Card>
    </section>
  );
};

export default ResultSection;
