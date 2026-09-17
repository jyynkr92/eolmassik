import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import TextField from '@/components/ui/text-field';
import { MAX_HEADCOUNT } from '@/constants/settlement';
import { PARTICIPANTS_TEXT } from '@/constants/text/participants';
import { validateParticipantName } from '@/lib/participants/validate-participant-name';
import type { Participant } from '@/types/settlement';

const { detail: DETAIL_TEXT } = PARTICIPANTS_TEXT;

interface Props {
  participant: Participant;
  /** 이름 중복 검사 대상. 본인은 검사에서 빠진다. */
  participants: Participant[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (participantId: string, patch: Partial<Omit<Participant, 'id'>>) => void;
  onRemove: (participantId: string) => void;
}

/**
 * 참여자 상세 시트. 이름 수정 · 인원 조정 · 삭제를 함께 받는다. 기획설계 5.2
 *
 * 인원을 칩 탭으로 순환시키던 방식을 걷어냈다. 올리기만 되고 내리려면 상한까지 돌아야 해서
 * 되돌리는 비용이 올리는 비용보다 훨씬 컸다. 여기서는 ⊖ / ⊕ 로 양방향이고 경계에서 멈춘다.
 *
 * 이름 수정이 여기 있는 이유는 따로 있다. 이름을 고치려고 참여자를 지웠다 다시 넣으면 id 가
 * 바뀌고, 그 사람이 들어간 항목의 부담자 목록과 추가 부담이 함께 날아간다. id 를 지킨 채
 * 이름만 바꿀 길이 반드시 있어야 한다.
 *
 * 저장은 닫을 때 한 번이다. 취소 수단이 없어 닫기가 곧 확정이고, 저장 지점이 하나여야
 * "어느 필드는 언제 저장되나"를 다시 설명하지 않아도 된다. 키를 칠 때마다 내보내면
 * "지영" 을 "민수" 로 고치는 도중의 "민" 까지 저장되기도 한다.
 *
 * 다만 유효성은 필드마다 따로다. 이름이 비어 있어 버려지더라도 인원 변경은 저장한다.
 *
 * 입력 상태는 이 컴포넌트가 들고 있고, 호출부가 열 때마다 새로 마운트해 초기화한다.
 */
const ParticipantDetailSheet = ({
  participant,
  participants,
  isOpen,
  onOpenChange,
  onSave,
  onRemove,
}: Props) => {
  const [name, setName] = useState(participant.name);
  const [headcount, setHeadcount] = useState(participant.headcount);

  const check = validateParticipantName(name, participants, participant.id);
  const errorMessage = check.isValid ? undefined : PARTICIPANTS_TEXT.nameError[check.error];

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (nextIsOpen) {
      onOpenChange(true);
      return;
    }

    const patch: Partial<Omit<Participant, 'id'>> = {};
    if (check.isValid && check.name !== participant.name) patch.name = check.name;
    if (headcount !== participant.headcount) patch.headcount = headcount;

    // 바뀐 게 없으면 내보내지 않는다. 스토어가 새 객체를 만들어 구독자를 전부 깨운다
    if (Object.keys(patch).length > 0) onSave(participant.id, patch);

    onOpenChange(false);
  };

  const handleHeadcountStep = (step: number) => {
    const next = headcount + step;
    if (next < 1 || next > MAX_HEADCOUNT) return;

    setHeadcount(next);
  };

  // 지우고 닫는 길은 저장을 건너뛴다. 사라질 참여자의 이름과 인원을 쓸 이유가 없다
  const handleRemove = () => {
    onRemove(participant.id);
    onOpenChange(false);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={DETAIL_TEXT.title(participant.name)}
      description={DETAIL_TEXT.description}
    >
      <div className="flex flex-col gap-6 pb-2">
        <TextField
          label={DETAIL_TEXT.nameLabel}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          {...(errorMessage !== undefined && { error: errorMessage })}
        />

        {/* 버튼 두 개와 값이 한 덩어리로 읽히도록 묶는다. legend 가 그 묶음의 이름이 된다 */}
        <fieldset>
          <legend className="text-on-surface-muted text-sm font-medium">
            {DETAIL_TEXT.headcountLabel}
          </legend>

          {/* fieldset 에 직접 flex 를 주면 legend 배치가 브라우저마다 갈린다 */}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                size="lg"
                variant="outline"
                aria-label={DETAIL_TEXT.headcountDecrease}
                disabled={headcount <= 1}
                onClick={() => handleHeadcountStep(-1)}
              >
                <Minus size={20} aria-hidden />
              </Button>

              {/* 값이 바뀐 걸 스크린리더도 듣도록 live 로 둔다 */}
              <output
                aria-live="polite"
                className="tabular text-on-surface-base w-16 text-center text-lg font-semibold"
              >
                {DETAIL_TEXT.headcountUnit(headcount)}
              </output>

              <Button
                isIconOnly
                size="lg"
                variant="outline"
                aria-label={DETAIL_TEXT.headcountIncrease}
                disabled={headcount >= MAX_HEADCOUNT}
                onClick={() => handleHeadcountStep(1)}
              >
                <Plus size={20} aria-hidden />
              </Button>
            </div>

            <p className="text-on-surface-muted text-xs">{DETAIL_TEXT.headcountHint}</p>
          </div>
        </fieldset>

        <Button variant="danger" size="lg" isFullWidth onClick={handleRemove}>
          {DETAIL_TEXT.removeAction}
        </Button>
      </div>
    </Sheet>
  );
};

export default ParticipantDetailSheet;
