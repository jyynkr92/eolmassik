import { formatAmount, formatWon } from '@/lib/format';

/** [3] 항목 입력. 기획설계 5.3 */
export const ITEMS_TEXT = {
  title: '항목',
  addAction: '항목 추가',

  nameLabel: '항목 이름',
  namePlaceholder: '바베큐장 이용료',
  amountLabel: '금액',
  /** 이름이 없는 항목도 목록에서 구분되어야 한다. 행 묶음의 이름으로 쓴다. */
  rowLabel: (name: string) => (name === '' ? '이름 없는 항목' : name),

  empty: '함께 쓴 돈을 항목으로 넣어 주세요',
  /** 항목은 부담할 사람이 있어야 만들 수 있다. 결제자도 참여자 중에서 정해진다. */
  needsParticipants: '참여자를 먼저 추가해 주세요',

  /**
   * 행 아래에 붙는 상태 요약. 기획설계 5.3
   *
   * 결제자는 항상 적고, 나머지는 기본값(전원이 똑같이 나눔)에서 벗어난 항목에만 적는다.
   * 부담자 구성까지 모든 행에 "5명 N빵" 으로 적으면 열 줄 중 아홉 줄이 같은 말이라 정작
   * 예외인 한 줄이 묻힌다. 결제자는 목록에서 확인할 다른 길이 없어 예외로 둔다.
   */
  summary: {
    payer: (name: string) => `${name} 결제`,
    /** 결제자가 없으면 이 항목은 정산에서 통째로 빠진다. */
    noPayer: '결제자 없음',
    /**
     * 부담자를 아무도 고르지 않으면 계산이 결제자에게 전액을 지운다. 기획설계 4.1
     * "부담할 사람이 없어요" 라고 적으면 계산과 반대되는 말이 된다.
     * 누가 무는지는 바로 앞의 `payer` 가 말했으므로 이름을 다시 적지 않는다.
     */
    payerOnly: '혼자 부담',
    partial: (participantCount: number) => `${participantCount}명만 부담`,
    full: (name: string) => `${name} 전액`,
    amount: (name: string, value: number) => `${name} +${formatAmount(value)}`,
  },

  /**
   * 행을 눌러 여는 상세 시트. 기획설계 5.4
   *
   * 결제자·부담자·추가 부담을 여기서 정한다. 행에는 이름과 금액만 두고, 나머지는 전부
   * 이 시트가 맡는다.
   */
  detail: {
    /** 행마다 같은 이름이어도 된다. 어느 항목인지는 행 묶음의 legend 가 말해 준다. */
    openAction: '상세 설정',
    /**
     * 시트를 연 시점이 아니라 지금 이름으로 만든다.
     *
     * 참여자 상세와 달리 여기서는 이름을 고칠 수 없다. 이름을 바꾸는 입력칸이 행에 있고
     * 시트는 그 위에 떠 있어서, 열려 있는 동안 제목이 바뀔 길이 없다.
     */
    title: (name: string) => `${name} 상세`,
    description: (amount: number) => `${formatWon(amount)}을 누가 어떻게 나눌지 정해요`,

    payerLabel: '결제자',
    payerHint: '이 항목을 실제로 결제한 사람이에요',
    /** 결제자가 없으면 이 항목은 정산에서 통째로 빠진다. 시트를 연 이유가 대개 이것이다. */
    payerMissing: '결제자를 골라야 이 항목이 정산에 들어가요',

    bearerLabel: '부담자',
    /** 인원이 1이면 굳이 적지 않는다. 대부분의 참여자가 1인이라 전부 적으면 눈에 걸린다. */
    bearerName: (name: string, headcount: number) =>
      headcount > 1 ? `${name} (${headcount}인)` : name,
    bearerHint: '체크를 풀면 이 항목에서 빠져요. 오른쪽 금액은 지금 부담액이에요',

    /** 사람마다 붙는 추가 부담 펼치기 버튼. 기획설계 3.4 */
    extraChargeAction: (name: string) => `${name} 추가 부담`,
    extraChargeRemoveAction: (name: string) => `${name} 추가 부담 빼기`,
    extraChargeLabel: (name: string) => `${name} 추가 부담 금액`,
    extraChargePlaceholder: '8,000',
    /** 전액 부담은 금액 지정의 특수 케이스라 같은 줄에서 토글로 바꾼다. 기획설계 3.4 */
    fullChargeAction: '전액',

    removeAction: '항목 삭제하기',
    /** 삭제 확인 화면. 시트를 겹쳐 띄우지 않고 이 시트의 내용을 갈아 끼운다. */
    removeConfirmTitle: (name: string) => `${name} 삭제`,
    removeConfirmBody: '이 항목의 금액과 부담자, 추가 부담 설정이 함께 사라져요',
  },

  count: (total: number) => `${total}개`,
  totalLabel: '합계',
  /** 합계에서 빠진 항목이 있으면 이유를 알린다. 결제자는 상세 시트에서 고른다. */
  excludedNotice: (count: number) => `결제자가 없는 항목 ${count}개는 합계에서 빠졌어요`,
  /**
   * 빠진 항목을 한 번에 되살리는 버튼. 결제자를 지우면 그 사람이 결제한 항목이 전부
   * 여기로 떨어지는데, 항목마다 시트를 열게 하지 않는다.
   *
   * 이름 뒤에 조사를 붙이지 않는다. 받침 유무에 따라 "민수로" / "지영으로" 가 갈려서
   * 문구 하나로는 둘 다 맞출 수 없다.
   */
  applyDefaultPayerAction: (name: string) => `기본 결제자(${name})로 한 번에 지정`,
} as const;
