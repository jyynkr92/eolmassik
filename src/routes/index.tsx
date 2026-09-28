import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import ConfirmActions from '@/components/ui/confirm-actions';
import Sheet from '@/components/ui/sheet';
import { COMMON_TEXT } from '@/constants/text/common';
import { HOME_TEXT } from '@/constants/text/home';
import ItemSection from '@/features/items/item-section';
import ParticipantSection from '@/features/participants/participant-section';
import ResultSection from '@/features/result/result-section';
import { hasPayer } from '@/lib/items/has-payer';
import { useSettlementActions, useSettlementStore } from '@/store/settlement-store';

/**
 * 편집 화면. 기획설계 5.1 의 [1]~[4] 를 한 페이지 안의 섹션으로 푼다.
 * 라우트를 나누면 뒤로 가기마다 작성 중인 정산이 끊긴다.
 */
const HomePage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasSubmittedRef = useRef(false);
  const participants = useSettlementStore((state) => state.settlement.participants);
  const items = useSettlementStore((state) => state.settlement.items);
  const settlementId = useSettlementStore((state) => state.settlement.id);
  const { reset } = useSettlementActions();
  const invalidCount = items.filter((item) => !hasPayer(item, participants)).length;
  const canSubmit = participants.length > 0 && items.length > 0 && invalidCount === 0;

  const handleResetConfirm = () => {
    reset();
    setIsSubmitted(false);
    setIsResetConfirming(false);
  };

  useEffect(() => {
    if (isSubmitted) {
      hasSubmittedRef.current = true;
      resultHeadingRef.current?.focus();
      return;
    }

    if (hasSubmittedRef.current) editorHeadingRef.current?.focus();
  }, [isSubmitted]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1
            ref={editorHeadingRef}
            tabIndex={-1}
            className="focus-ring text-on-surface-base text-2xl font-bold"
          >
            {COMMON_TEXT.appName}
          </h1>
          <p className="text-on-surface-muted mt-2 text-sm">{HOME_TEXT.tagline}</p>
        </div>
        {!isSubmitted && (participants.length > 0 || items.length > 0) && (
          <Button variant="ghost" onClick={() => setIsResetConfirming(true)}>
            {COMMON_TEXT.resetSettlementAction}
          </Button>
        )}
      </header>

      <Sheet
        isOpen={isResetConfirming}
        onOpenChange={setIsResetConfirming}
        title={COMMON_TEXT.resetSettlementTitle}
        description={COMMON_TEXT.removeWarning}
        footer={
          <ConfirmActions
            confirmLabel={COMMON_TEXT.resetSettlementConfirm}
            onCancel={() => setIsResetConfirming(false)}
            onConfirm={handleResetConfirm}
          />
        }
      >
        <p className="text-on-surface-muted text-sm">{COMMON_TEXT.resetSettlementDescription}</p>
      </Sheet>

      {isSubmitted ? (
        <ResultSection
          headingRef={resultHeadingRef}
          onEdit={() => setIsSubmitted(false)}
          onReset={() => setIsResetConfirming(true)}
        />
      ) : (
        <>
          <ParticipantSection key={`participants:${settlementId}`} />
          <ItemSection key={`items:${settlementId}`} />
          <section aria-label={HOME_TEXT.submitSectionLabel} className="flex flex-col gap-2">
            <Button
              size="lg"
              isFullWidth
              disabled={!canSubmit}
              onClick={() => setIsSubmitted(true)}
            >
              {HOME_TEXT.submitAction}
            </Button>
            <p role="status" className="text-on-surface-muted text-center text-sm">
              {invalidCount > 0
                ? HOME_TEXT.invalidItems(invalidCount)
                : items.length === 0
                  ? HOME_TEXT.needsItem
                  : ''}
            </p>
          </section>
        </>
      )}
    </main>
  );
};

export const Route = createFileRoute('/')({ component: HomePage });
