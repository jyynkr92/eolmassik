import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import { createUuid } from '@/lib/uuid';
import type { ExtraCharge, Item, Options, Participant, Settlement } from '@/types/settlement';

/**
 * Settlement 전역 스토어.
 *
 * 액션은 state 안에 `actions` 하나로 묶는다. 이 객체는 스토어가 만들어질 때 한 번
 * 만들어지고 다시 바뀌지 않아, 컴포넌트가 통째로 꺼내도 참조가 그대로라 리렌더를
 * 유발하지 않는다. 액션마다 selector 를 하나씩 쓰던 것보다 호출부가 짧아지고,
 * "무엇이 값이고 무엇이 동작인지"가 타입에서 바로 갈린다.
 */

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

/** 정산을 바꾸는 동작 묶음. */
export type SettlementActions = {
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

/**
 * 단일 Settlement 객체만 다루므로 전역 스토어 하나로 충분하다.
 *
 * persist 미들웨어로 작성 중인 정산을 localStorage 에 남겨 새로고침 시
 * 복구한다. 기획설계 7 — P1
 */
export type SettlementState = {
  settlement: Settlement;
  actions: SettlementActions;
};

/**
 * localStorage 에 남기는 부분. `actions` 는 제외한다.
 *
 * 빼지 않으면 직렬화 과정에서 함수가 떨어져 나가 `actions: {}` 가 저장되고, 복원할 때
 * zustand 가 그 빈 객체를 현재 state 위에 얕게 덮어써 액션이 통째로 사라진다.
 * 새로고침 전에는 멀쩡하고 새로고침 뒤에만 아무 버튼도 안 먹는 형태로 터진다.
 */
type PersistedState = Pick<SettlementState, 'settlement'>;

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
 * 저장된 값이 Settlement 의 모양을 갖췄는지.
 *
 * localStorage 는 같은 출처의 사용자 데이터라 공유 URL 만큼 불신할 대상은 아니다.
 * 다만 손으로 고치거나 다른 탭의 옛 빌드가 남긴 값이 들어오면, 배열이어야 할 자리가
 * 비어 있는 채로 렌더까지 흘러가 `participants.map` 에서 터진다. 여기서 한 번 막는다.
 */
const isSettlementShape = (persisted: unknown): persisted is PersistedState => {
  if (typeof persisted !== 'object' || persisted === null) return false;

  const { settlement } = persisted as { settlement?: Partial<Settlement> };
  if (!settlement) return false;

  return Array.isArray(settlement.participants) && Array.isArray(settlement.items);
};

/**
 * v1 에는 `options.fullChargeSplit` 이 없다. 빠진 채로 복원하면 `fullChargeSplit === 'even'`
 * 비교가 false 로 떨어져 headcount 비례 분기를 타므로, 기본값을 채워 넣는다.
 */
const migrateSettlement = (persisted: unknown): PersistedState | undefined => {
  if (typeof persisted !== 'object' || persisted === null) return undefined;

  const { settlement } = persisted as { settlement?: Settlement };
  if (!settlement) return undefined;

  const options: Options = { ...DEFAULT_OPTIONS, ...settlement.options };
  return { settlement: { ...settlement, options } };
};

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set) => {
      /**
       * 모든 액션이 같은 형태라 변환 함수를 감싸기만 한다.
       *
       * 변환 결과가 원본과 같은 참조면 이전 state 를 그대로 돌려준다. 새 객체를 넘기면
       * zustand 의 `Object.is` 검사를 통과해 구독자가 전부 깨어나고, persist 미들웨어도
       * 구독자라 아무것도 안 바뀐 액션마다 localStorage 에 동기 쓰기가 일어난다.
       */
      const apply =
        <Args extends unknown[]>(
          transform: (settlement: Settlement, ...args: Args) => Settlement,
        ) =>
        (...args: Args) =>
          set((state) => {
            const settlement = transform(state.settlement, ...args);
            if (settlement === state.settlement) return state;

            return { settlement };
          });

      return {
        settlement: createEmptySettlement(),

        actions: {
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
        },
      };
    },
    {
      name: 'eolmassik:draft',
      // Options 에 fullChargeSplit 이 추가되면서 스키마가 바뀌었다.
      version: 2,
      partialize: (state): PersistedState => ({ settlement: state.settlement }),
      /**
       * 저장된 값에서 `settlement` 만 가져온다.
       *
       * 기본 merge 는 저장된 객체를 현재 state 위에 통째로 얕게 덮는다. 저장소에 어쩌다
       * `actions` 키가 들어 있으면(예전 빌드가 남긴 값, 손으로 고친 값) 그게 진짜 액션
       * 객체를 덮어써 새로고침 뒤에만 아무 버튼도 안 먹는다. 쓰는 쪽은 partialize 가
       * 막지만, 이미 저장된 값까지 막으려면 읽는 쪽도 좁혀야 한다.
       */
      merge: (persisted, current): SettlementState => {
        const settlement = isSettlementShape(persisted) ? persisted.settlement : current.settlement;

        return { ...current, settlement };
      },
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as PersistedState;
        return migrateSettlement(persisted);
      },
    },
  ),
);

/** 액션 묶음. 참조가 고정이라 통째로 꺼내도 리렌더가 늘지 않는다. */
export const useSettlementActions = () => useSettlementStore((state) => state.actions);
