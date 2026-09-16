import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import type { Item, Settlement } from '@/types/settlement';

import {
  addItemTo,
  addParticipantTo,
  removeExtraChargeFrom,
  removeItemFrom,
  removeParticipantFrom,
  setExtraChargeIn,
  setOptionsIn,
  toggleItemParticipantIn,
  updateItemIn,
  updateParticipantIn,
} from './settlement-actions';

const emptySettlement = (): Settlement => ({
  id: 'settlement',
  title: '',
  createdAt: 0,
  participants: [],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: null,
});

/** 이름 순서대로 참여자를 넣고, 넣은 순서대로 id 를 함께 돌려준다. */
const withParticipants = (names: string[]) => {
  const settlement = names.reduce(addParticipantTo, emptySettlement());
  const ids = settlement.participants.map((participant) => participant.id);
  return { settlement, ids };
};

const lastItem = (settlement: Settlement): Item => {
  const item = settlement.items.at(-1);
  if (!item) throw new Error('항목이 없습니다.');

  return item;
};

describe('addParticipantTo', () => {
  it('첫 참여자를 기본 결제자로 정한다', () => {
    const settlement = addParticipantTo(emptySettlement(), '은정이네');

    expect(settlement.participants).toHaveLength(1);
    expect(settlement.participants[0]).toMatchObject({ name: '은정이네', headcount: 1 });
    expect(settlement.defaultPayerId).toBe(settlement.participants[0]?.id);
  });

  it('두 번째 참여자부터는 기본 결제자를 바꾸지 않는다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수']);

    expect(settlement.defaultPayerId).toBe(ids[0]);
  });
});

describe('updateParticipantIn', () => {
  it('headcount 를 바꾼다', () => {
    const { settlement, ids } = withParticipants(['은정이네']);
    const updated = updateParticipantIn(settlement, ids[0] ?? '', { headcount: 2 });

    expect(updated.participants[0]?.headcount).toBe(2);
  });

  it('없는 참여자면 원본을 그대로 돌려준다', () => {
    const { settlement } = withParticipants(['은정이네']);

    expect(updateParticipantIn(settlement, 'unknown', { headcount: 2 })).toBe(settlement);
  });
});

describe('removeParticipantFrom', () => {
  it('세 군데 참조를 모두 정리한다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수', '철준']);
    const [eunjeong, minsu, cheoljun] = ids;

    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;
    const charged = setExtraChargeIn(withItem, itemId, {
      participantId: minsu ?? '',
      type: 'amount',
      value: 8000,
    });
    const paidByMinsu = updateItemIn(charged, itemId, { payerId: minsu ?? '' });

    const removed = removeParticipantFrom(paidByMinsu, minsu ?? '');
    const item = lastItem(removed);

    expect(removed.participants.map((participant) => participant.id)).toEqual([eunjeong, cheoljun]);
    expect(item.participantIds).toEqual([eunjeong, cheoljun]);
    expect(item.extraCharges).toEqual([]);
    // 결제자 자리는 비운다. 다른 사람으로 대체하면 내지 않은 돈을 낸 것으로 기록된다.
    expect(item.payerId).toBe('');
  });

  it('지운 사람과 무관한 항목은 원본 참조를 유지한다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수']);
    const [eunjeong, minsu] = ids;

    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;
    // 민수를 부담자에서 빼두면 이 항목은 민수를 전혀 참조하지 않는다.
    const excluded = toggleItemParticipantIn(withItem, itemId, minsu ?? '');
    const untouched = lastItem(excluded);

    const removed = removeParticipantFrom(excluded, minsu ?? '');

    expect(lastItem(removed)).toBe(untouched);
    expect(untouched.payerId).toBe(eunjeong);
  });

  it('기본 결제자를 지우면 남은 첫 참여자로 넘긴다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수']);
    const removed = removeParticipantFrom(settlement, ids[0] ?? '');

    expect(removed.defaultPayerId).toBe(ids[1]);
  });

  it('마지막 참여자를 지우면 기본 결제자가 사라지고 항목 결제자도 빈다', () => {
    const { settlement, ids } = withParticipants(['은정이네']);
    const withItem = addItemTo(settlement, '고기');

    const removed = removeParticipantFrom(withItem, ids[0] ?? '');

    expect(removed.participants).toEqual([]);
    expect(removed.defaultPayerId).toBeNull();
    expect(lastItem(removed).payerId).toBe('');
  });

  it('없는 참여자면 원본을 그대로 돌려준다', () => {
    const { settlement } = withParticipants(['은정이네']);

    expect(removeParticipantFrom(settlement, 'unknown')).toBe(settlement);
  });
});

describe('addItemTo', () => {
  it('전원 참여 + 기본 결제자로 만든다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수']);
    const item = lastItem(addItemTo(settlement, '고기'));

    expect(item).toMatchObject({ name: '고기', amount: 0, payerId: ids[0], extraCharges: [] });
    expect(item.participantIds).toEqual(ids);
  });

  it('참여자가 없으면 결제자 없이 만들어진다', () => {
    const item = lastItem(addItemTo(emptySettlement()));

    expect(item.payerId).toBe('');
    expect(item.participantIds).toEqual([]);
  });
});

describe('removeItemFrom', () => {
  it('없는 항목이면 원본을 그대로 돌려준다', () => {
    const settlement = addItemTo(emptySettlement(), '고기');

    expect(removeItemFrom(settlement, 'unknown')).toBe(settlement);
    expect(removeItemFrom(settlement, lastItem(settlement).id).items).toEqual([]);
  });
});

describe('toggleItemParticipantIn', () => {
  it('뺐다가 다시 넣으면 participants 순서를 지킨다', () => {
    const { settlement, ids } = withParticipants(['은정이네', '민수', '철준']);
    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;
    const [, minsu] = ids;

    const excluded = toggleItemParticipantIn(withItem, itemId, minsu ?? '');
    expect(lastItem(excluded).participantIds).toEqual([ids[0], ids[2]]);

    const included = toggleItemParticipantIn(excluded, itemId, minsu ?? '');
    expect(lastItem(included).participantIds).toEqual(ids);
  });

  it('참여자 목록에 없는 id 는 무시한다', () => {
    const { settlement } = withParticipants(['은정이네']);
    const withItem = addItemTo(settlement, '고기');

    expect(toggleItemParticipantIn(withItem, lastItem(withItem).id, 'unknown')).toBe(withItem);
  });
});

describe('setExtraChargeIn / removeExtraChargeFrom', () => {
  it('같은 사람이면 덮어쓴다', () => {
    const { settlement, ids } = withParticipants(['은정이네']);
    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;
    const participantId = ids[0] ?? '';

    const charged = setExtraChargeIn(withItem, itemId, {
      participantId,
      type: 'amount',
      value: 8000,
    });
    const overwritten = setExtraChargeIn(charged, itemId, { participantId, type: 'full' });

    expect(lastItem(overwritten).extraCharges).toEqual([{ participantId, type: 'full' }]);
  });

  it('추가 부담을 지운다', () => {
    const { settlement, ids } = withParticipants(['은정이네']);
    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;
    const participantId = ids[0] ?? '';

    const charged = setExtraChargeIn(withItem, itemId, { participantId, type: 'full' });

    expect(lastItem(removeExtraChargeFrom(charged, itemId, participantId)).extraCharges).toEqual(
      [],
    );
    expect(removeExtraChargeFrom(charged, itemId, 'unknown')).toBe(charged);
  });
});

describe('setOptionsIn', () => {
  it('넘긴 키만 덮어쓴다', () => {
    const settlement = setOptionsIn(emptySettlement(), { rounding: 'ceil100' });

    expect(settlement.options).toEqual({ ...DEFAULT_OPTIONS, rounding: 'ceil100' });
  });
});

describe('patch 의 undefined 처리', () => {
  it('금액을 undefined 로 덮어쓰지 않는다', () => {
    const { settlement } = withParticipants(['은정이네']);
    const withItem = addItemTo(settlement, '고기');
    const itemId = lastItem(withItem).id;

    const priced = updateItemIn(withItem, itemId, { amount: 32000 });
    const cleared = updateItemIn(priced, itemId, { amount: undefined });

    // undefined 가 들어가면 calculateSettlement 의 Math.max(0, amount) 가 NaN 이 된다.
    expect(lastItem(cleared).amount).toBe(32000);
  });

  it('headcount 와 options 도 undefined 를 무시한다', () => {
    const { settlement, ids } = withParticipants(['은정이네']);
    const updated = updateParticipantIn(settlement, ids[0] ?? '', { headcount: undefined });

    expect(updated.participants[0]?.headcount).toBe(1);
    expect(setOptionsIn(settlement, { rounding: undefined }).options.rounding).toBe(
      DEFAULT_OPTIONS.rounding,
    );
  });
});
