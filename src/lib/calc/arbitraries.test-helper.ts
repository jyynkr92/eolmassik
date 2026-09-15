/**
 * 계산 로직 property 테스트용 arbitrary 모음. **테스트 전용 파일이다.**
 *
 * 앱 코드에서 import 하면 fast-check 가 프로덕션 번들로 끌려온다.
 * biome.json 의 override 가 테스트가 아닌 파일에서의 import 를 막는다.
 *
 * 합계 불변식은 예제 테스트로는 부족하다. 추가 부담이 항목 금액을 넘는 경우,
 * headcount 가 0인 참여자, 부담자가 없는 항목 같은 케이스까지 생성해서 흔든다.
 */
import fc from 'fast-check';

import type { ExtraCharge, Item, Options, Participant, Settlement } from '@/types/settlement';

export const arbitraryParticipants = (): fc.Arbitrary<Participant[]> =>
  fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 6 }).map((headcounts) =>
    headcounts.map((headcount, index) => ({
      id: `p${index}`,
      name: `참여자${index}`,
      headcount,
    })),
  );

export const arbitraryOptions = (): fc.Arbitrary<Options> =>
  fc.record({
    rounding: fc.constantFrom('none' as const, 'ceil10' as const, 'ceil100' as const),
    roundingAbsorber: fc.constantFrom('payer' as const, 'split' as const),
    fullChargeSplit: fc.constantFrom('even' as const, 'headcount' as const),
  });

/** 추가 부담 합이 항목 금액을 넘는 경우를 일부러 만들 수 있게 상한을 amount 로 둔다. */
const arbitraryExtraCharge = (
  participantIds: string[],
  amount: number,
): fc.Arbitrary<ExtraCharge> =>
  fc.record({
    participantId: fc.constantFrom(...participantIds),
    type: fc.constantFrom('amount' as const, 'full' as const),
    value: fc.integer({ min: 0, max: Math.max(1, amount) }),
  });

type ItemConstraints = {
  /**
   * 참여자를 지운 뒤 그 사람이 결제자인 항목이 남는 경로를 낮은 빈도로 섞는다.
   * `calculateItem` 은 결제자가 유효하다고 전제하므로 `calculateSettlement` 쪽에서만 켠다.
   */
  withMissingPayer?: boolean;
};

const arbitraryPayerId = (participantIds: string[], { withMissingPayer }: ItemConstraints) => {
  const known = fc.constantFrom(...participantIds);
  if (!withMissingPayer) return known;

  return fc.oneof(
    { arbitrary: known, weight: 9 },
    { arbitrary: fc.constant('삭제된참여자'), weight: 1 },
  );
};

export const arbitraryItem = (
  participantIds: string[],
  constraints: ItemConstraints = {},
): fc.Arbitrary<Item> =>
  fc.integer({ min: 0, max: 200_000 }).chain((amount) =>
    fc
      .record({
        payerId: arbitraryPayerId(participantIds, constraints),
        participantIds: fc.shuffledSubarray(participantIds),
        extraCharges: fc.array(arbitraryExtraCharge(participantIds, amount), { maxLength: 3 }),
      })
      .map((rest) => ({ id: 'i0', name: '항목', amount, ...rest })),
  );

export const arbitrarySettlement = (): fc.Arbitrary<Settlement> =>
  arbitraryParticipants().chain((participants) => {
    const participantIds = participants.map((participant) => participant.id);
    return fc
      .record({
        items: fc.array(arbitraryItem(participantIds, { withMissingPayer: true }), {
          maxLength: 5,
        }),
        options: arbitraryOptions(),
      })
      .map(({ items, options }) => ({
        id: 's0',
        title: '테스트 정산',
        createdAt: 0,
        participants,
        items: items.map((item, index) => ({ ...item, id: `i${index}`, name: `항목${index}` })),
        options,
        defaultPayerId: participantIds[0] ?? null,
      }));
  });
