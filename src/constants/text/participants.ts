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
  chipAction: (name: string, headcount: number) => `${name}, ${headcount}인. 눌러서 수정`,
  count: (total: number) => `${total}명`,

  /** 칩을 눌렀을 때 올라오는 상세 시트. */
  detail: {
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

    removeAction: '삭제하기',
  },
} as const;
