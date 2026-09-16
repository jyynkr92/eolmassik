import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import { COMMON_TEXT } from '@/constants/text/common';

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** 시트 제목. 스크린리더가 시트를 열자마자 읽는 이름이라 비울 수 없다. */
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * 아래에서 올라오는 바텀 시트. 항목 상세에 쓴다. 기획설계 5.4
 *
 * 한 손으로 쓰는 화면이라 가운데 모달 대신 아래에서 올린다. 엄지가 닿는 범위에
 * 내용이 들어오고, 화면 위쪽에 원래 목록이 그대로 남아 맥락이 끊기지 않는다.
 *
 * 포커스 가두기, `Esc` 닫기, 배경 스크롤 잠금, 열기 전 포커스 복원은 Radix Dialog 가
 * 처리한다. 직접 만들면 이 중 하나는 반드시 빠진다.
 */
const Sheet = ({ isOpen, onOpenChange, title, description, children }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out bg-scrim fixed inset-0" />

        <Dialog.Content className="bg-surface-base data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out safe-bottom fixed inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-4 rounded-t-2xl px-4 pt-4">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="text-on-surface-base text-lg font-bold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-on-surface-muted text-sm">
                  {description}
                </Dialog.Description>
              )}
            </div>

            <Dialog.Close asChild>
              <Button isIconOnly variant="ghost" aria-label={COMMON_TEXT.close}>
                <X size={20} aria-hidden />
              </Button>
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Sheet;
