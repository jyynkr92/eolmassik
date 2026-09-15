/**
 * 정산 도메인 모델 — 기획설계 3장.
 *
 * 금액은 모두 **정수 원 단위**다. 소수점을 허용하는 순간 부담액 합계가
 * 항목 금액과 1원 단위로 어긋나므로, 분배 과정에서 생기는 나머지는
 * 잔차로 따로 계산해 흡수자에게 몰아준다. 기획설계 4.1 / 4.3
 */

/** 참여자. */
export type Participant = {
  id: string
  /** "은정이네", "민수" */
  name: string
  /**
   * N빵 가중치. 기본 1.
   * 커플·가족을 별도 그룹 엔티티로 만들지 않고 한 참여자에 2 이상을 준다.
   * 기획설계 3.2 — 설계 결정
   */
  headcount: number
}

/** 추가 부담 방식. `full` 은 value 가 항목 전액인 특수 케이스다. */
export type ExtraChargeType = 'amount' | 'full'

/**
 * 추가 부담. "13,000원 중 우리가 8,000원 낼게"와 "바베큐는 우리가 낼게"는
 * 같은 개념의 변주이므로 하나로 통합한다. 계산 로직은 하나로 유지하고
 * UI 에서만 "전액" 토글로 따로 노출한다. 기획설계 3.4
 */
export type ExtraCharge = {
  participantId: string
  type: ExtraChargeType
  /** type 이 'amount' 일 때만 사용. 정수 원 단위. */
  value?: number
}

/** 정산 항목. */
export type Item = {
  id: string
  /** "고기", "바베큐장 이용료" */
  name: string
  /** 정수 원 단위. */
  amount: number
  /**
   * 실제로 결제한 사람. 부담자(participantIds)와 반드시 분리해야
   * "누가 누구에게 얼마 보내면 되는지"가 나온다. 기획설계 3.3 — 설계 결정
   */
  payerId: string
  /** 이 항목을 부담하는 사람들. 신규 항목의 기본값은 전원이다. */
  participantIds: string[]
  extraCharges: ExtraCharge[]
}

/** 원 단위 반올림 정책. 기획설계 3.5 / 4.3 */
export type Rounding = 'none' | 'ceil10' | 'ceil100'

/** 나눠떨어지지 않고 남은 잔차를 누가 흡수할지. */
export type RoundingAbsorber = 'payer' | 'split'

export type Options = {
  rounding: Rounding
  roundingAbsorber: RoundingAbsorber
}

export type Settlement = {
  id: string
  /** "9/15 캠핑" */
  title: string
  createdAt: number
  participants: Participant[]
  items: Item[]
  options: Options
  /**
   * 기본 결제자. 항목마다 매번 고르게 하지 않고 이 사람을 자동 적용한 뒤
   * 예외인 항목만 payerId 를 바꾼다. 기획설계 9 — 결정 기록 7
   */
  defaultPayerId: string | null
}
