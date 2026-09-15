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
  itemResults: ItemResult[];
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
