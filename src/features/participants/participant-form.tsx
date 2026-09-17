import { type FormEvent, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import { PARTICIPANTS_TEXT } from '@/constants/text/participants';
import { validateParticipantName } from '@/lib/participants/validate-participant-name';
import type { Participant } from '@/types/settlement';

interface Props {
  /** 이름 중복 검사 대상. */
  participants: Participant[];
  onAdd: (name: string) => void;
}

/**
 * 참여자 이름 입력. 기획설계 5.2
 *
 * `<form>` 으로 감싸 엔터로 제출되게 한다. 모바일 키보드의 "완료" 가 제출로 이어지고,
 * 제출 뒤에도 포커스를 입력칸에 그대로 두어 키보드가 내려가지 않는다. 여러 명을
 * 연달아 넣는 화면이라 한 명마다 키보드가 내려가면 입력이 끊긴다.
 *
 * 빈 이름은 오류로 띄우지 않는다. 아무것도 안 쓴 처음 상태가 곧 빈 이름이라, 화면에
 * 들어오자마자 빨간 글씨를 보게 된다. 못 누른다는 건 비활성 버튼이 이미 말해 준다.
 */
const ParticipantForm = ({ participants, onAdd }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');

  const check = validateParticipantName(name, participants);
  const errorMessage =
    check.isValid || check.error === 'empty' ? undefined : PARTICIPANTS_TEXT.nameError[check.error];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!check.isValid) return;

    onAdd(check.name);
    setName('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex-1">
        <TextField
          ref={inputRef}
          label={PARTICIPANTS_TEXT.nameLabel}
          isLabelHidden
          placeholder={PARTICIPANTS_TEXT.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          enterKeyHint="done"
          {...(errorMessage !== undefined && { error: errorMessage })}
        />
      </div>
      <Button type="submit" size="lg" disabled={!check.isValid}>
        {PARTICIPANTS_TEXT.addAction}
      </Button>
    </form>
  );
};

export default ParticipantForm;
