/** 계산 결과 타입 — 기획설계 4장. 모든 금액은 정수 원 단위다. */

/** 한 항목에서 참여자 한 명이 지는 부담액. */
export type ItemShare = {
  participantId: string;
  /** 0 이상의 정수. */
  amount: number;
};

export type ItemResult = {
  itemId: string;
  /** `participants` 배열 순서를 따른다. */
  shares: ItemShare[];
  /** 부담액 합계. `rounding` 이 `'none'` 이면 항상 `item.amount` 와 같다. */
  total: number;
};

export type ParticipantBalance = {
  participantId: string;
  /** 이 사람이 실제로 결제한 총액. */
  paid: number;
  /** 이 사람이 부담해야 할 총액. */
  owed: number;
  /** `paid - owed`. 양수면 받을 사람, 음수면 보낼 사람이다. */
  net: number;
};

export type Transfer = {
  fromId: string;
  toId: string;
  /** 1 이상의 정수. */
  amount: number;
};

export type RoundedTransfers = {
  transfers: Transfer[];
  /** 올림 때문에 더 걷힌 금액. 받는 사람(보통 결제자) 이득이다. 기획설계 4.3 */
  excess: number;
};

export type SettlementResult = {
  /** 정산에 반영된 항목만. 결제자가 없는 항목은 빠진다. */
  itemResults: ItemResult[];
  /**
   * 결제자가 참여자 목록에 없어 정산에서 제외된 항목.
   *
   * 결제액을 낼 사람이 없는데 부담만 시키면 "보낼 곳 없는 빚" 이 생기고
   * 합계 불변식도 깨진다. 조용히 버리지 않고 드러내서 UI 가 결제자 지정을 유도한다.
   */
  invalidItemIds: string[];
  /** `participants` 배열 순서를 따른다. */
  balances: ParticipantBalance[];
  transfers: Transfer[];
  /**
   * 송금액 올림 때문에 더 걷힌 금액. `rounding` 이 `'none'` 이면 0이다.
   * 받는 사람(보통 결제자) 이득이므로 결과 화면에 명시해야 한다. 기획설계 4.3
   */
  roundingExcess: number;
  /** 전체 항목 금액의 합. */
  totalAmount: number;
};
