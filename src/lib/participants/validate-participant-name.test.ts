import { describe, expect, it } from 'vitest';

import type { Participant } from '@/types/settlement';

import { validateParticipantName } from './validate-participant-name';

const participant = (id: string, name: string): Participant => ({ id, name, headcount: 1 });

const participants = [participant('p1', '민수'), participant('p2', 'Alice')];

describe('validateParticipantName', () => {
  it('새 이름이면 통과하고 다듬은 값을 돌려준다', () => {
    expect(validateParticipantName('  지영  ', participants)).toEqual({
      isValid: true,
      name: '지영',
    });
  });

  it('비어 있으면 empty 다', () => {
    expect(validateParticipantName('', participants)).toEqual({ isValid: false, error: 'empty' });
    expect(validateParticipantName('   ', participants)).toEqual({
      isValid: false,
      error: 'empty',
    });
  });

  it('이미 있는 이름이면 duplicate 다', () => {
    expect(validateParticipantName('민수', participants)).toEqual({
      isValid: false,
      error: 'duplicate',
    });
  });

  it('앞뒤 공백만 다른 이름도 중복으로 본다', () => {
    expect(validateParticipantName('  민수  ', participants)).toEqual({
      isValid: false,
      error: 'duplicate',
    });
  });

  // 결과 화면에 이름이 비슷한 줄이 둘 생기면 누가 누구인지 구분되지 않는다
  it('대소문자만 다른 이름도 중복으로 본다', () => {
    expect(validateParticipantName('alice', participants)).toEqual({
      isValid: false,
      error: 'duplicate',
    });
    expect(validateParticipantName('ALICE', participants)).toEqual({
      isValid: false,
      error: 'duplicate',
    });
  });

  // 이름을 그대로 둔 채 인원만 바꾸는 경우까지 막으면 안 된다
  it('excludeId 로 넘긴 본인은 비교에서 뺀다', () => {
    expect(validateParticipantName('민수', participants, 'p1')).toEqual({
      isValid: true,
      name: '민수',
    });
    expect(validateParticipantName('민수', participants, 'p2')).toEqual({
      isValid: false,
      error: 'duplicate',
    });
  });

  it('참여자가 없으면 빈 이름만 거른다', () => {
    expect(validateParticipantName('민수', [])).toEqual({ isValid: true, name: '민수' });
    expect(validateParticipantName('', [])).toEqual({ isValid: false, error: 'empty' });
  });
});
