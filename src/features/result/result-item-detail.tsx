import { useReducedMotion } from 'framer-motion';
import * as m from 'framer-motion/m';
import { useId, useState } from 'react';

import { RESULT_TEXT } from '@/constants/text/result';
import type { ItemResult } from '@/lib/calc/types';
import { formatWon } from '@/lib/format';
import type { Item } from '@/types/settlement';

interface Props {
  item: Item;
  itemResult: ItemResult;
  nameById: Map<string, string>;
}

const ResultItemDetail = ({ item, itemResult, nameById }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const shouldReduceMotion = useReducedMotion();
  const extraChargeByParticipantId = new Map(
    item.extraCharges.map((charge) => [charge.participantId, charge]),
  );

  return (
    <li className="border-outline-base rounded-xl border p-3">
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="focus-ring flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg text-left"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="text-on-surface-base font-semibold">
          {RESULT_TEXT.itemName(item.name)}
        </span>
        <span className="tabular text-on-surface-base font-semibold">{formatWon(item.amount)}</span>
        <span className="text-on-surface-muted w-full text-sm">
          {RESULT_TEXT.payer(nameById.get(item.payerId) ?? '')} ·{' '}
          <span className="text-accent-text">
            {isOpen ? RESULT_TEXT.closeDetail : RESULT_TEXT.openDetail}
          </span>
        </span>
      </button>
      <m.div
        id={panelId}
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: 'easeOut' }}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className="overflow-hidden"
      >
        <div className="border-outline-base mt-3 flex flex-col gap-3 border-t pt-3 text-sm">
          <div>
            <h4 className="text-on-surface-base font-semibold">{RESULT_TEXT.shares}</h4>
            <ul className="mt-1 flex flex-col gap-1">
              {itemResult.shares.map((share) => {
                const charge = extraChargeByParticipantId.get(share.participantId);

                return (
                  <li key={share.participantId} className="flex justify-between gap-2">
                    <span className="text-on-surface-muted">
                      {nameById.get(share.participantId)}
                      {charge && (
                        <span className="text-accent-text ml-1">
                          (
                          {charge.type === 'full'
                            ? RESULT_TEXT.fullCharge
                            : RESULT_TEXT.amountCharge(charge.value ?? 0)}
                          )
                        </span>
                      )}
                    </span>
                    <span className="tabular text-on-surface-base">{formatWon(share.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </m.div>
    </li>
  );
};

export default ResultItemDetail;
