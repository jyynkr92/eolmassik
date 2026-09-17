import { useState } from 'react';

import Card from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import { PARTICIPANTS_TEXT } from '@/constants/text/participants';
import { useSettlementActions, useSettlementStore } from '@/store/settlement-store';
import type { Participant } from '@/types/settlement';

import ParticipantDetailSheet from './participant-detail-sheet';
import ParticipantForm from './participant-form';

/**
 * [2] 참여자 입력. 기획설계 5.2
 *
 * 스토어를 읽는 곳을 여기 하나로 모으고, 아래 컴포넌트들은 props 만 받는다.
 * 칩 하나가 바뀔 때마다 목록 전체가 다시 그려지지만, 참여자는 많아야 열 명 남짓이라
 * 측정할 만한 비용이 아니다.
 */
const ParticipantSection = () => {
  const participants = useSettlementStore((state) => state.settlement.participants);
  const { addParticipant, updateParticipant, removeParticipant } = useSettlementActions();

  /**
   * 시트를 연 참여자. 닫은 뒤에도 남겨 둬야 내려가는 애니메이션이 그려진다.
   * 지워 버리면 시트가 사라지는 게 아니라 그 자리에서 없어진다.
   */
  const [selected, setSelected] = useState<Participant | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /**
   * 시트를 연 횟수. 이것만 key 로 쓰면 열 때마다 새로 마운트된다.
   *
   * 닫아도 시트를 언마운트하지 않으므로, 참여자 id 를 key 로 쓰면 같은 칩을 다시 열 때
   * 리마운트가 일어나지 않는다. 그러면 저장하지 않고 버린 편집이 시트 안에 그대로 남아
   * 다음에 열 때 되살아난다.
   */
  const [openSeq, setOpenSeq] = useState(0);

  const handleChipClick = (participant: Participant) => {
    setSelected(participant);
    setOpenSeq((seq) => seq + 1);
    setIsSheetOpen(true);
  };

  const hasParticipants = participants.length > 0;

  return (
    <Card
      title={PARTICIPANTS_TEXT.title}
      action={
        hasParticipants && (
          <span className="tabular text-on-surface-muted text-sm">
            {PARTICIPANTS_TEXT.count(participants.length)}
          </span>
        )
      }
    >
      <ParticipantForm participants={participants} onAdd={addParticipant} />

      {hasParticipants ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <li key={participant.id}>
                <Chip
                  onClick={() => handleChipClick(participant)}
                  aria-label={PARTICIPANTS_TEXT.chipAction(participant.name, participant.headcount)}
                  suffix={
                    participant.headcount > 1 && (
                      <span className="tabular bg-accent-subtle text-accent-text rounded-full px-2 py-0.5 text-xs font-semibold">
                        {participant.headcount}
                      </span>
                    )
                  }
                >
                  {participant.name}
                </Chip>
              </li>
            ))}
          </ul>

          <p className="text-on-surface-muted text-xs">{PARTICIPANTS_TEXT.editHint}</p>
        </div>
      ) : (
        <p className="text-on-surface-muted py-2 text-sm">{PARTICIPANTS_TEXT.empty}</p>
      )}

      {selected && (
        <ParticipantDetailSheet
          key={openSeq}
          participant={selected}
          participants={participants}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onSave={updateParticipant}
          onRemove={removeParticipant}
        />
      )}
    </Card>
  );
};

export default ParticipantSection;
