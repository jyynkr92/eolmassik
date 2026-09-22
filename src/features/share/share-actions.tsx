import { Check, Copy, Link2, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import { SHARE_FEEDBACK_DURATION_MS, SHARE_FEEDBACK_EXIT_DURATION_MS } from '@/constants/share';
import { RESULT_TEXT } from '@/constants/text/result';
import type { SettlementResult } from '@/lib/calc/types';
import { cn } from '@/lib/cn';
import { createSettlementShareUrl } from '@/lib/share/create-settlement-share-url';
import { formatSettlementText } from '@/lib/share/format-settlement-text';
import { shareSettlementNatively } from '@/lib/share/share-settlement-natively';
import { shareSettlementToKakao } from '@/lib/share/share-settlement-to-kakao';
import type { Settlement } from '@/types/settlement';

type ActionFeedback = { message: string; isError: boolean; phase: 'visible' | 'exiting' };

interface Props {
  settlement: Settlement;
  result: SettlementResult;
}

const ShareActions = ({ settlement, result }: Props) => {
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const latestCopyRequest = useRef(0);

  useEffect(() => {
    if (!actionFeedback) return;

    const timeoutId = window.setTimeout(
      () => {
        if (actionFeedback.phase === 'exiting') {
          setActionFeedback(null);
          return;
        }

        setActionFeedback({ ...actionFeedback, phase: 'exiting' });
      },
      actionFeedback.phase === 'exiting'
        ? SHARE_FEEDBACK_EXIT_DURATION_MS
        : SHARE_FEEDBACK_DURATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  const showFeedback = (message: string, isError = false) => {
    setActionFeedback({ message, isError, phase: 'visible' });
  };

  const getShareUrl = () => {
    const shareUrl = createSettlementShareUrl(settlement);
    if (shareUrl.success) return shareUrl.data;

    showFeedback(
      shareUrl.error === 'too-long' ? RESULT_TEXT.linkTooLong : RESULT_TEXT.linkCreateError,
      true,
    );
    return null;
  };

  const handleTextCopy = async () => {
    const requestId = ++latestCopyRequest.current;
    try {
      await navigator.clipboard.writeText(formatSettlementText(settlement, result));
      if (requestId === latestCopyRequest.current) showFeedback(RESULT_TEXT.copySuccess);
    } catch {
      if (requestId === latestCopyRequest.current) showFeedback(RESULT_TEXT.copyError, true);
    }
  };

  const handleLinkCopy = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback(RESULT_TEXT.linkCopySuccess);
    } catch {
      showFeedback(RESULT_TEXT.copyError, true);
    }
  };

  const handleKakaoShare = async () => {
    const shareUrl = getShareUrl();
    const javascriptKey = import.meta.env.VITE_KAKAO_JS_KEY?.trim();
    if (!shareUrl || !javascriptKey) return;

    const kakaoResult = await shareSettlementToKakao(settlement, shareUrl, javascriptKey);
    if (kakaoResult.success) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback(RESULT_TEXT.kakaoFallback);
    } catch {
      showFeedback(RESULT_TEXT.kakaoError, true);
    }
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    const nativeResult = await shareSettlementNatively(settlement, shareUrl);
    if (nativeResult.status !== 'failed') return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback(RESULT_TEXT.nativeShareFallback);
    } catch {
      showFeedback(RESULT_TEXT.nativeShareError, true);
    }
  };

  const hasKakaoKey = Boolean(import.meta.env.VITE_KAKAO_JS_KEY?.trim());
  const hasNativeShare = typeof navigator.share === 'function';

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        isFullWidth
        leadingIcon={
          actionFeedback?.message === RESULT_TEXT.copySuccess ? (
            <Check size={18} aria-hidden />
          ) : (
            <Copy size={18} aria-hidden />
          )
        }
        onClick={handleTextCopy}
      >
        {RESULT_TEXT.copyAction}
      </Button>
      {hasKakaoKey && (
        <Button
          size="lg"
          isFullWidth
          variant="soft"
          leadingIcon={<MessageCircle size={18} aria-hidden />}
          onClick={handleKakaoShare}
        >
          {RESULT_TEXT.kakaoAction}
        </Button>
      )}
      {hasNativeShare ? (
        <Button
          size="lg"
          isFullWidth
          variant="outline"
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={handleNativeShare}
        >
          {RESULT_TEXT.nativeShareAction}
        </Button>
      ) : (
        <Button
          size="lg"
          isFullWidth
          variant="outline"
          leadingIcon={<Link2 size={18} aria-hidden />}
          onClick={handleLinkCopy}
        >
          {RESULT_TEXT.linkCopyAction}
        </Button>
      )}
      {actionFeedback && (
        <p
          role={actionFeedback.isError ? 'alert' : 'status'}
          className={cn(
            'bg-on-surface-base text-on-surface-inverse fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-50 mx-auto w-fit max-w-sm rounded-xl px-4 py-3 text-center text-sm shadow-lg',
            actionFeedback.phase === 'exiting' ? 'animate-toast-out' : 'animate-toast-in',
          )}
        >
          {actionFeedback.message}
        </p>
      )}
    </div>
  );
};

export default ShareActions;
