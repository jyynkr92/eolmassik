import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import type { Settlement } from '@/types/settlement';

import { useSettlementStore } from './settlement-store';

const STORAGE_KEY = 'eolmassik:draft';

const settlementFixture = (): Settlement => ({
  id: 'fixture',
  title: '9/15 캠핑',
  createdAt: 1_726_000_000_000,
  participants: [{ id: 'p1', name: '민수', headcount: 1 }],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: 'p1',
});

const readStored = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  return JSON.parse(raw) as { state: Record<string, unknown>; version: number };
};

describe('useSettlementStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettlementStore.getState().actions.reset();
  });

  it('액션을 actions 아래에 묶어 둔다', () => {
    const { actions, ...values } = useSettlementStore.getState();

    expect(Object.keys(values)).toEqual(['settlement']);
    expect(typeof actions.addParticipant).toBe('function');
  });

  it('액션 객체의 참조가 바뀌지 않는다', () => {
    const before = useSettlementStore.getState().actions;

    before.addParticipant('민수');
    before.setTitle('9/15 캠핑');

    expect(useSettlementStore.getState().actions).toBe(before);
  });

  describe('영속화', () => {
    it('localStorage 에 settlement 만 남긴다', () => {
      useSettlementStore.getState().actions.addParticipant('민수');

      expect(Object.keys(readStored()?.state ?? {})).toEqual(['settlement']);
    });

    /**
     * partialize 가 없으면 직렬화에서 함수가 떨어져 `actions: {}` 가 저장되고,
     * 복원할 때 그 빈 객체가 진짜 액션 객체를 덮어쓴다. 새로고침 뒤에만 터지는 형태라
     * 눈으로는 잘 안 잡힌다.
     */
    it('복원한 뒤에도 액션이 살아 있다', async () => {
      // partialize 가 없던 빌드가 남겼을 법한 모양으로 세운다
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: { settlement: settlementFixture(), actions: {} }, version: 2 }),
      );

      await useSettlementStore.persist.rehydrate();

      const { settlement, actions } = useSettlementStore.getState();
      expect(settlement.participants).toHaveLength(1);
      expect(typeof actions.addParticipant).toBe('function');
    });

    it('v1 데이터를 복원하면 빠진 옵션을 기본값으로 채운다', async () => {
      const { options, ...rest } = settlementFixture();
      const v1Settlement = { ...rest, options: { rounding: 'none', roundingAbsorber: 'payer' } };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: { settlement: v1Settlement }, version: 1 }),
      );

      await useSettlementStore.persist.rehydrate();

      expect(useSettlementStore.getState().settlement.options.fullChargeSplit).toBe('even');
    });
  });
});
