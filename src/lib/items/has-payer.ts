import type { Item, Participant } from '@/types/settlement';

/**
 * 결제자가 참여자 목록에 있는지.
 *
 * 없으면 `calculateSettlement` 이 이 항목을 통째로 뺀다. 결제액을 낼 사람이 없는데 부담만
 * 시키면 "보낼 곳 없는 빚" 이 생기기 때문이다.
 *
 * 참여자를 지우면 그 사람을 결제자로 쓰던 항목의 `payerId` 가 빈 문자열이 되므로,
 * 평범한 조작만으로도 이 상태에 닿는다.
 */
export const hasPayer = (item: Item, participants: Participant[]): boolean =>
  participants.some((participant) => participant.id === item.payerId);
