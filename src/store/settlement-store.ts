import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import { createUuid } from '@/lib/uuid';
import type { ExtraCharge, Item, Options, Participant, Settlement } from '@/types/settlement';

import {
  addItemTo,
  addParticipantTo,
  removeExtraChargeFrom,
  removeItemFrom,
  removeParticipantFrom,
  setDefaultPayerIdIn,
  setExtraChargeIn,
  setOptionsIn,
  setTitleIn,
  toggleItemParticipantIn,
  updateItemIn,
  updateParticipantIn,
} from './settlement-actions';

/**
 * 단일 Settlement 객체만 다루므로 전역 스토어 하나로 충분하다.
 *
 * persist 미들웨어로 작성 중인 정산을 localStorage 에 남겨 새로고침 시
 * 복구한다. 기획설계 7 — P1
 */
type SettlementState = {
  settlement: Settlement;

  setTitle: (title: string) => void;
  setDefaultPayerId: (participantId: string | null) => void;
  setOptions: (patch: Partial<Options>) => void;

  addParticipant: (name: string) => void;
  updateParticipant: (participantId: string, patch: Partial<Omit<Participant, 'id'>>) => void;
  removeParticipant: (participantId: string) => void;

  addItem: (name?: string) => void;
  updateItem: (itemId: string, patch: Partial<Omit<Item, 'id'>>) => void;
  removeItem: (itemId: string) => void;

  toggleItemParticipant: (itemId: string, participantId: string) => void;
  setExtraCharge: (itemId: string, charge: ExtraCharge) => void;
  removeExtraCharge: (itemId: string, participantId: string) => void;

  reset: () => void;
  /** 공유받은 정산을 복제해서 편집 모드로 넘어올 때 쓴다. 기획설계 5.6 */
  replaceSettlement: (settlement: Settlement) => void;
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
    (set) => {
      /** 모든 액션이 같은 형태라 변환 함수를 감싸기만 한다. */
      const apply =
        <Args extends unknown[]>(
          transform: (settlement: Settlement, ...args: Args) => Settlement,
        ) =>
        (...args: Args) =>
          set((state) => ({ settlement: transform(state.settlement, ...args) }));

      return {
        settlement: createEmptySettlement(),

        setTitle: apply(setTitleIn),
        setDefaultPayerId: apply(setDefaultPayerIdIn),
        setOptions: apply(setOptionsIn),

        addParticipant: apply(addParticipantTo),
        updateParticipant: apply(updateParticipantIn),
        removeParticipant: apply(removeParticipantFrom),

        addItem: apply(addItemTo),
        updateItem: apply(updateItemIn),
        removeItem: apply(removeItemFrom),

        toggleItemParticipant: apply(toggleItemParticipantIn),
        setExtraCharge: apply(setExtraChargeIn),
        removeExtraCharge: apply(removeExtraChargeFrom),

        reset: () => set({ settlement: createEmptySettlement() }),
        replaceSettlement: (settlement: Settlement) => set({ settlement }),
      };
    },
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
