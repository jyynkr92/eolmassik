/**
 * 정산 계산 로직 — 기획설계 4장.
 *
 * UI에 의존하지 않는 순수 함수만 둔다. 돈 계산이 1원이라도 틀리면 서비스
 * 신뢰가 무너지므로 모든 함수는 단위 테스트와 property 테스트로 고정한다.
 */
export { calculateItem } from './calculate-item'
export { calculateSettlement } from './calculate-settlement'
export type { RoundedTransfers } from './round-transfers'
export { roundTransfers } from './round-transfers'
export { simplifyDebts } from './simplify-debts'
export type {
  ItemResult,
  ItemShare,
  ParticipantBalance,
  SettlementResult,
  Transfer,
} from './types'
