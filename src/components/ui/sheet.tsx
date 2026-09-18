import { ArrowLeft, X } from 'lucide-react';
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
  /**
   * 넘기면 제목 왼쪽에 뒤로 가기 버튼이 붙는다.
   *
   * 시트 안에서 화면을 갈아 끼울 때 쓴다. (삭제 확인처럼) 시트를 하나 더 겹쳐 띄우는
   * 대신 같은 시트의 내용을 바꾸면, 배경이 두 번 어두워지지도 포커스 가두기가 두 겹이
   * 되지도 않는다. 대신 돌아올 길이 필요하다.
   */
  onBack?: () => void;
  /**
   * 스크롤 영역 밖에 고정되는 아래쪽 영역. "적용" 처럼 항상 닿아야 하는 버튼을 둔다.
   * 내용이 길어 스크롤이 생겨도 이 자리는 화면에 남는다.
   */
  footer?: ReactNode;
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
const Sheet = ({ isOpen, onOpenChange, title, description, onBack, footer, children }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out bg-scrim fixed inset-0" />

        <Dialog.Content className="bg-surface-base data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out safe-bottom fixed inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-4 rounded-t-2xl px-4 pt-4">
          <header className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              {/* 아이콘을 왼쪽 끝에 맞춘다. 버튼의 좌우 여백까지 밀어 넣으면 제목만 들여쓴
                  것처럼 보인다 */}
              {onBack && (
                <Button
                  isIconOnly
                  variant="ghost"
                  aria-label={COMMON_TEXT.back}
                  onClick={onBack}
                  className="-ml-2"
                >
                  <ArrowLeft size={20} aria-hidden />
                </Button>
              )}

              <div className="flex min-w-0 flex-col gap-2">
                <Dialog.Title className="text-on-surface-base text-lg font-bold">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-on-surface-muted text-sm">
                    {description}
                  </Dialog.Description>
                )}
              </div>
            </div>

            <Dialog.Close asChild>
              <Button isIconOnly variant="ghost" aria-label={COMMON_TEXT.close}>
                <X size={20} aria-hidden />
              </Button>
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* 아래 여백은 Content 의 safe-bottom 이 맡는다. 여기서 또 주면 버튼 아래가 빈다 */}
          {footer && <div className="border-outline-base border-t pt-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Sheet;
