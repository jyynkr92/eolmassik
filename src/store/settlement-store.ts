import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import { createUuid } from '@/lib/uuid';
import type { Options, Settlement } from '@/types/settlement';

/**
 * 단일 Settlement 객체만 다루므로 전역 스토어 하나로 충분하다.
 *
 * persist 미들웨어로 작성 중인 정산을 localStorage 에 남겨 새로고침 시
 * 복구한다. 기획설계 7 — P1
 */
type SettlementState = {
  settlement: Settlement;
  reset: () => void;
};

const createEmptySettlement = (): Settlement => ({
  id: createUuid(),
  title: '',
  createdAt: Date.now(),
  participants: [],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: null,
});

/**
 * v1 에는 `options.fullChargeSplit` 이 없다. 빠진 채로 복원하면 `fullChargeSplit === 'even'`
 * 비교가 false 로 떨어져 headcount 비례 분기를 타므로, 기본값을 채워 넣는다.
 */
const migrateSettlement = (persisted: unknown): SettlementState | undefined => {
  if (typeof persisted !== 'object' || persisted === null) return undefined;

  const { settlement } = persisted as { settlement?: Settlement };
  if (!settlement) return undefined;

  const options: Options = { ...DEFAULT_OPTIONS, ...settlement.options };
  return { ...(persisted as SettlementState), settlement: { ...settlement, options } };
};

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set) => ({
      settlement: createEmptySettlement(),
      reset: () => set({ settlement: createEmptySettlement() }),
    }),
    {
      name: 'eolmassik:draft',
      // Options 에 fullChargeSplit 이 추가되면서 스키마가 바뀌었다.
      version: 2,
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as SettlementState;
        return migrateSettlement(persisted);
      },
    },
  ),
);
