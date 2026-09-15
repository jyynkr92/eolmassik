import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_OPTIONS } from '@/constants/settlement'
import type { Settlement } from '@/types/settlement'

/**
 * 단일 Settlement 객체만 다루므로 전역 스토어 하나로 충분하다.
 *
 * persist 미들웨어로 작성 중인 정산을 localStorage 에 남겨 새로고침 시
 * 복구한다. 기획설계 7 — P1
 */
type SettlementState = {
  settlement: Settlement
  reset: () => void
}

const createEmptySettlement = (): Settlement => ({
  id: crypto.randomUUID(),
  title: '',
  createdAt: Date.now(),
  participants: [],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: null,
})

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set) => ({
      settlement: createEmptySettlement(),
      reset: () => set({ settlement: createEmptySettlement() }),
    }),
    {
      name: 'eolmassik:draft',
      version: 1,
    },
  ),
)
