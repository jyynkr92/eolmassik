import { ArrowRight, Check, Copy, List, ReceiptText, Send, UsersRound, Wallet } from 'lucide-react';
import { type RefObject, useEffect, useState } from 'react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { RESULT_TEXT } from '@/constants/text/result';
import { formatSettlementText } from '@/features/share/format-settlement-text';
import { calculateSettlement } from '@/lib/calc';
import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/format';
import { useSettlementStore } from '@/store/settlement-store';

const COPY_FEEDBACK_DURATION_MS = 2500;
const COPY_FEEDBACK_EXIT_MS = 180;

type CopyFeedback = { kind: 'success' | 'error'; phase: 'visible' | 'exiting' };

interface Props {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onEdit: () => void;
}

/** 입력된 원본과 계산 결과를 함께 보여준다. 금액은 스토어에 저장하지 않는다. */
const ResultSection = ({ headingRef, onEdit }: Props) => {
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);
  const settlement = useSettlementStore((state) => state.settlement);
  const result = calculateSettlement(settlement);
  const { participants, items } = settlement;
  const totalHeadcount = participants.reduce((sum, participant) => sum + participant.headcount, 0);
  const nameById = new Map(participants.map((participant) => [participant.id, participant.name]));
  const itemResultById = new Map(result.itemResults.map((item) => [item.itemId, item]));

  useEffect(() => {
    if (!copyFeedback) return;

    const timeoutId = window.setTimeout(
      () => {
        if (copyFeedback.phase === 'exiting') {
          setCopyFeedback(null);
          return;
        }

        setCopyFeedback({ ...copyFeedback, phase: 'exiting' });
      },
      copyFeedback.phase === 'exiting' ? COPY_FEEDBACK_EXIT_MS : COPY_FEEDBACK_DURATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

  const handleTextCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatSettlementText(settlement, result));
      setCopyFeedback({ kind: 'success', phase: 'visible' });
    } catch {
      setCopyFeedback({ kind: 'error', phase: 'visible' });
    }
  };

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
        <Button variant="outline" onClick={onEdit}>
          {RESULT_TEXT.editAction}
        </Button>
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

      <Button
        size="lg"
        isFullWidth
        leadingIcon={
          copyFeedback?.kind === 'success' ? (
            <Check size={18} aria-hidden />
          ) : (
            <Copy size={18} aria-hidden />
          )
        }
        onClick={handleTextCopy}
      >
        {RESULT_TEXT.copyAction}
      </Button>
      {copyFeedback && (
        <p
          role={copyFeedback.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'bg-on-surface-base text-on-surface-inverse fixed inset-x-4 bottom-6 z-50 mx-auto w-fit max-w-sm rounded-xl px-4 py-3 text-center text-sm shadow-lg',
            copyFeedback.phase === 'exiting' ? 'animate-toast-out' : 'animate-toast-in',
          )}
        >
          {copyFeedback.kind === 'success' ? RESULT_TEXT.copySuccess : RESULT_TEXT.copyError}
        </p>
      )}

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
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const itemResult = itemResultById.get(item.id);
            if (!itemResult) return null;

            return (
              <li key={item.id}>
                <details className="border-outline-base rounded-xl border p-3">
                  <summary className="focus-ring flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-lg">
                    <span className="text-on-surface-base font-semibold">
                      {RESULT_TEXT.itemName(item.name)}
                    </span>
                    <span className="tabular text-on-surface-base font-semibold">
                      {formatWon(item.amount)}
                    </span>
                    <span className="text-on-surface-muted w-full text-sm">
                      {RESULT_TEXT.payer(nameById.get(item.payerId) ?? '')} ·{' '}
                      <span className="text-accent-text">{RESULT_TEXT.openDetail}</span>
                    </span>
                  </summary>
                  <div className="border-outline-base mt-3 flex flex-col gap-3 border-t pt-3 text-sm">
                    {item.extraCharges.length > 0 && (
                      <div>
                        <h4 className="text-on-surface-muted">{RESULT_TEXT.extraCharges}</h4>
                        <ul className="text-on-surface-base mt-1">
                          {item.extraCharges.map((charge) => (
                            <li key={charge.participantId}>
                              {charge.type === 'full'
                                ? RESULT_TEXT.fullCharge(nameById.get(charge.participantId) ?? '')
                                : RESULT_TEXT.amountCharge(
                                    nameById.get(charge.participantId) ?? '',
                                    charge.value ?? 0,
                                  )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 className="text-on-surface-base font-semibold">{RESULT_TEXT.shares}</h4>
                      <ul className="mt-1 flex flex-col gap-1">
                        {itemResult.shares.map((share) => (
                          <li key={share.participantId} className="flex justify-between gap-2">
                            <span className="text-on-surface-muted">
                              {nameById.get(share.participantId)}
                            </span>
                            <span className="tabular text-on-surface-base">
                              {formatWon(share.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
};

export default ResultSection;
