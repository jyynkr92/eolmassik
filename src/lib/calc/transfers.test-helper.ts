/**
 * 송금 검증용 테스트 헬퍼. **테스트 전용 파일이다.**
 *
 * "송금을 반영하면 순액이 0" 은 이 프로젝트의 핵심 불변식이라 여러 테스트가
 * 함께 검증한다. 검증 코드를 파일마다 베끼면 한쪽만 고쳐져도 알 수 없다.
 */
import type { ParticipantBalance, Transfer } from './types';

/** 송금을 전부 반영한 뒤 남은 참여자별 순액. */
export const applyTransfers = (balances: ParticipantBalance[], transfers: Transfer[]) => {
  const settled = new Map(balances.map((balance) => [balance.participantId, balance.net]));

  for (const transfer of transfers) {
    settled.set(transfer.fromId, (settled.get(transfer.fromId) ?? 0) + transfer.amount);
    settled.set(transfer.toId, (settled.get(transfer.toId) ?? 0) - transfer.amount);
  }

  return settled;
};

/** 보내는 사람별 송금 총액. */
export const sumSentById = (transfers: Transfer[]) => {
  const sent = new Map<string, number>();

  for (const transfer of transfers) {
    sent.set(transfer.fromId, (sent.get(transfer.fromId) ?? 0) + transfer.amount);
  }

  return sent;
};
