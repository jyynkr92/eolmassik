/** [2] 참여자 입력. 기획설계 5.2 */
export const PARTICIPANTS_TEXT = {
  title: '참여자',

  nameLabel: '참여자 이름',
  namePlaceholder: '이름을 입력하고 엔터',
  addAction: '추가',

  /** 이름 검사 실패 문구. `validateParticipantName` 의 에러 코드로 찾는다. */
  nameError: {
    empty: '이름을 입력해 주세요',
    duplicate: '이미 있는 이름이에요',
  },

  empty: '함께 정산할 사람을 추가해 주세요',
  /** 칩을 눌러 수정한다는 건 눌러 보기 전에는 알 수 없어서 한 줄로 알려준다. */
  editHint: '이름을 누르면 수정할 수 있어요',

  /** 칩의 스크린리더용 이름. 인원과 다음 동작을 함께 읽어 준다. */
  chipAction: (name: string, headcount: number, isDefaultPayer: boolean) =>
    isDefaultPayer
      ? `${name}, ${headcount}인, 기본 결제자. 눌러서 수정`
      : `${name}, ${headcount}인. 눌러서 수정`,
  /** 칩에 붙는 기본 결제자 뱃지. 좁은 칩 안이라 두 글자로 줄인다. */
  defaultPayerBadge: '결제',
  count: (total: number) => `${total}명`,

  /** 칩을 눌렀을 때 올라오는 상세 시트. */
  detail: {
    /**
     * 시트를 연 시점의 이름으로 고정한다.
     *
     * Dialog 의 제목은 곧 다이얼로그의 접근 가능한 이름이다. 입력에 맞춰 바꾸면 글자를
     * 칠 때마다 스크린리더가 다이얼로그 이름을 다시 읽는다.
     */
    title: (name: string) => `${name} 수정`,
    description: '이름과 인원을 바꾸거나 삭제할 수 있어요',
    nameLabel: '이름',

    headcountLabel: '인원',
    headcountDecrease: '인원 줄이기',
    headcountIncrease: '인원 늘리기',
    /**
     * 인원은 N빵 가중치다. 기획설계 3.2
     *
     * "가족이나 커플일 때 쓴다"만 적으면 이 값이 금액을 바꾼다는 걸 알 수 없다.
     * 올렸을 때 부담액이 어떻게 달라지는지를 먼저 말한다.
     */
    headcountHint:
      '인원수만큼 나눠 낼 몫이 늘어나요. 가족이나 커플을 한 사람으로 넣었을 때 올려 주세요',
    headcountUnit: (headcount: number) => `${headcount}인`,

    /**
     * 기본 결제자 지정. 기획설계 9 — 결정 기록 7
     *
     * 해제는 두지 않는다. 비우면 새 항목이 결제자 없이 만들어져 정산에서 통째로 빠지는데,
     * 그걸 사용자가 고를 이유가 없다. 바꾸고 싶으면 다른 사람을 지정하면 된다.
     */
    defaultPayerAction: '기본 결제자로 지정',
    defaultPayerCurrent: '이 사람이 기본 결제자예요',
    defaultPayerHint: '새로 만드는 항목의 결제자로 자동으로 들어가요',

    removeAction: '삭제하기',
    /**
     * 삭제 확인 화면. 시트를 겹쳐 띄우지 않고 이 시트의 내용을 갈아 끼운다.
     * 제목에 조사를 붙이지 않는다. 받침 유무로 "민수를" / "지영을" 이 갈린다.
     */
    removeConfirmTitle: (name: string) => `${name} 삭제`,
    removeConfirmBody:
      '이 참여자가 들어간 항목의 부담자와 추가 부담에서도 함께 빠져요. 결제자였던 항목은 결제자 자리가 비어요',
  },
} as const;
