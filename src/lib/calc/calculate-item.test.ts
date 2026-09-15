import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS } from '@/constants/settlement';
import type { ExtraCharge, Item, Options, Participant } from '@/types/settlement';

import { arbitraryItem, arbitraryOptions, arbitraryParticipants } from './arbitraries.test-helper';
import { calculateItem } from './calculate-item';

const participant = (id: string, headcount = 1): Participant => ({
  id,
  name: id,
  headcount,
});

const item = (overrides: Partial<Item> = {}): Item => ({
  id: 'i0',
  name: '항목',
  amount: 0,
  payerId: 'p0',
  participantIds: [],
  extraCharges: [],
  ...overrides,
});

const options = (overrides: Partial<Options> = {}): Options => ({
  ...DEFAULT_OPTIONS,
  ...overrides,
});

const amountOf = (result: { shares: { participantId: string; amount: number }[] }, id: string) =>
  result.shares.find((share) => share.participantId === id)?.amount;

describe('calculateItem', () => {
  it('기획설계 4.1 검증 예제 — 고기 32,000원의 잔차를 결제자가 흡수한다', () => {
    const participants = [
      participant('은정이네', 2),
      participant('민수'),
      participant('철준'),
      participant('영희'),
      participant('지훈'),
    ];
    const meat = item({
      name: '고기',
      amount: 32_000,
      payerId: '은정이네',
      participantIds: participants.map((p) => p.id),
      extraCharges: [{ participantId: '은정이네', type: 'amount', value: 12_000 }],
    });

    const result = calculateItem(meat, participants, DEFAULT_OPTIONS);

    expect(amountOf(result, '은정이네')).toBe(18_668);
    expect(amountOf(result, '민수')).toBe(3_333);
    expect(amountOf(result, '철준')).toBe(3_333);
    expect(amountOf(result, '영희')).toBe(3_333);
    expect(amountOf(result, '지훈')).toBe(3_333);
    expect(result.total).toBe(32_000);
  });

  it('잔차 흡수자가 split 이면 앞사람부터 1원씩 나눠 진다', () => {
    const participants = [participant('p0'), participant('p1'), participant('p2')];
    const target = item({
      amount: 10_000,
      payerId: 'p2',
      participantIds: ['p0', 'p1', 'p2'],
    });

    const result = calculateItem(target, participants, options({ roundingAbsorber: 'split' }));

    expect(result.shares.map((share) => share.amount)).toEqual([3_334, 3_333, 3_333]);
    expect(result.total).toBe(10_000);
  });

  it('결제자가 부담자가 아니면 첫 부담자가 잔차를 흡수한다', () => {
    const participants = [participant('p0'), participant('p1'), participant('p2')];
    const target = item({ amount: 10_000, payerId: 'p2', participantIds: ['p0', 'p1'] });

    const result = calculateItem(target, participants, DEFAULT_OPTIONS);

    expect(result.shares.map((share) => share.amount)).toEqual([5_000, 5_000]);
  });

  describe('추가 부담', () => {
    it('추가 부담 합이 항목 금액을 넘으면 비율로 축소해 합계를 지킨다', () => {
      const participants = [participant('p0'), participant('p1')];
      const target = item({
        amount: 9_999,
        participantIds: ['p0', 'p1'],
        extraCharges: [
          { participantId: 'p0', type: 'amount', value: 20_000 },
          { participantId: 'p1', type: 'amount', value: 20_000 },
        ],
      });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(result.shares.map((share) => share.amount)).toEqual([5_000, 4_999]);
      expect(result.total).toBe(9_999);
    });

    it('participantIds 에 없어도 추가 부담 대상은 부담자로 잡는다', () => {
      const participants = [participant('p0'), participant('p1')];
      const target = item({
        amount: 10_000,
        participantIds: ['p0'],
        extraCharges: [{ participantId: 'p1', type: 'amount', value: 4_000 }],
      });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(amountOf(result, 'p0')).toBe(6_000);
      expect(amountOf(result, 'p1')).toBe(4_000);
      expect(result.total).toBe(10_000);
    });

    it('한 사람에게 전액과 금액 지정이 함께 걸리면 전액만 남긴다', () => {
      const participants = [participant('p0'), participant('p1')];
      const extraCharges: ExtraCharge[] = [
        { participantId: 'p0', type: 'amount', value: 3_000 },
        { participantId: 'p0', type: 'full' },
      ];
      const target = item({ amount: 10_000, participantIds: ['p0', 'p1'], extraCharges });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(amountOf(result, 'p0')).toBe(10_000);
      expect(amountOf(result, 'p1')).toBe(0);
    });
  });

  describe('전액 부담', () => {
    it('전액 부담자가 금액 지정 부담을 뺀 나머지를 가져간다', () => {
      const participants = [participant('p0'), participant('p1'), participant('p2')];
      const target = item({
        amount: 10_000,
        participantIds: ['p0', 'p1', 'p2'],
        extraCharges: [
          { participantId: 'p0', type: 'full' },
          { participantId: 'p2', type: 'amount', value: 3_000 },
        ],
      });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(result.shares.map((share) => share.amount)).toEqual([7_000, 0, 3_000]);
    });

    it('전액 부담자가 여러 명이면 기본값은 headcount 를 무시한 n등분이다', () => {
      const participants = [participant('p0', 2), participant('p1'), participant('p2')];
      const target = item({
        amount: 10_000,
        participantIds: ['p0', 'p1', 'p2'],
        extraCharges: [
          { participantId: 'p0', type: 'full' },
          { participantId: 'p1', type: 'full' },
        ],
      });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(result.shares.map((share) => share.amount)).toEqual([5_000, 5_000, 0]);
    });

    it('fullChargeSplit 이 headcount 면 인원수 비례로 나눈다', () => {
      const participants = [participant('p0', 2), participant('p1'), participant('p2')];
      const target = item({
        amount: 10_000,
        payerId: 'p0',
        participantIds: ['p0', 'p1', 'p2'],
        extraCharges: [
          { participantId: 'p0', type: 'full' },
          { participantId: 'p1', type: 'full' },
        ],
      });

      const result = calculateItem(target, participants, options({ fullChargeSplit: 'headcount' }));

      expect(result.shares.map((share) => share.amount)).toEqual([6_667, 3_333, 0]);
      expect(result.total).toBe(10_000);
    });

    it('headcount 기준인데 전원 0이면 n등분으로 되돌린다', () => {
      const participants = [participant('p0', 0), participant('p1', 0)];
      const target = item({
        amount: 10_000,
        participantIds: ['p0', 'p1'],
        extraCharges: [
          { participantId: 'p0', type: 'full' },
          { participantId: 'p1', type: 'full' },
        ],
      });

      const result = calculateItem(target, participants, options({ fullChargeSplit: 'headcount' }));

      expect(result.shares.map((share) => share.amount)).toEqual([5_000, 5_000]);
    });
  });

  it('반올림 정책은 부담액을 건드리지 않는다', () => {
    const participants = [participant('p0'), participant('p1'), participant('p2')];
    const target = item({ amount: 10_000, participantIds: ['p0', 'p1', 'p2'] });

    // 올림은 송금 금액에만 적용한다. 항목 단위로 올리면 손해가 항목 수만큼 누적된다.
    const exact = calculateItem(target, participants, DEFAULT_OPTIONS);
    const ceiled = calculateItem(target, participants, options({ rounding: 'ceil100' }));

    expect(ceiled.shares).toEqual(exact.shares);
    expect(ceiled.total).toBe(10_000);
  });

  describe('엣지 케이스', () => {
    it('추가 부담만 걸린 사람에게 잔액을 몰아주지 않는다', () => {
      // "안 먹었는데 3,000원만 보탤게" 가 전액 부담으로 뒤집히면 안 된다.
      const participants = [participant('p0'), participant('p1')];
      const target = item({
        amount: 10_000,
        payerId: 'p0',
        participantIds: [],
        extraCharges: [{ participantId: 'p1', type: 'amount', value: 3_000 }],
      });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(amountOf(result, 'p0')).toBe(7_000);
      expect(amountOf(result, 'p1')).toBe(3_000);
      expect(result.total).toBe(10_000);
    });

    it('잔차 흡수자가 split 이어도 잔액은 결제자가 진다', () => {
      const participants = [participant('p0'), participant('p1')];
      const target = item({
        amount: 10_000,
        payerId: 'p0',
        participantIds: [],
        extraCharges: [{ participantId: 'p1', type: 'amount', value: 3_000 }],
      });

      const result = calculateItem(target, participants, options({ roundingAbsorber: 'split' }));

      expect(amountOf(result, 'p0')).toBe(7_000);
      expect(amountOf(result, 'p1')).toBe(3_000);
    });

    it('부담자가 없으면 결제자가 전액을 진다', () => {
      const participants = [participant('p0'), participant('p1')];
      const target = item({ amount: 10_000, payerId: 'p1', participantIds: [] });

      const result = calculateItem(target, participants, DEFAULT_OPTIONS);

      expect(result.shares).toEqual([{ participantId: 'p1', amount: 10_000 }]);
    });

    it('결제자마저 참여자 목록에 없으면 빈 결과를 낸다', () => {
      const result = calculateItem(
        item({ amount: 10_000, payerId: '유령', participantIds: [] }),
        [participant('p0')],
        DEFAULT_OPTIONS,
      );

      expect(result.shares).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('참여자가 1명이면 전액을 혼자 진다', () => {
      const result = calculateItem(
        item({ amount: 7_777, participantIds: ['p0'] }),
        [participant('p0')],
        DEFAULT_OPTIONS,
      );

      expect(result.shares).toEqual([{ participantId: 'p0', amount: 7_777 }]);
    });

    it('금액이 0원이면 전원 0원이다', () => {
      const participants = [participant('p0'), participant('p1')];
      const result = calculateItem(
        item({ amount: 0, participantIds: ['p0', 'p1'] }),
        participants,
        DEFAULT_OPTIONS,
      );

      expect(result.shares.map((share) => share.amount)).toEqual([0, 0]);
      expect(result.total).toBe(0);
    });

    it('headcount 가 전원 0이면 결제자가 전액을 진다', () => {
      const participants = [participant('p0', 0), participant('p1', 0)];
      const result = calculateItem(
        item({ amount: 10_000, participantIds: ['p0', 'p1'] }),
        participants,
        DEFAULT_OPTIONS,
      );

      expect(result.shares.map((share) => share.amount)).toEqual([10_000, 0]);
    });
  });

  describe('property', () => {
    const arbitraryCase = () =>
      arbitraryParticipants().chain((participants) =>
        fc.record({
          participants: fc.constant(participants),
          item: arbitraryItem(participants.map((p) => p.id)),
          options: arbitraryOptions(),
        }),
      );

    it('부담액의 합은 rounding 과 무관하게 항상 항목 금액과 같다', () => {
      fc.assert(
        fc.property(arbitraryCase(), ({ participants, item: target, options: generated }) => {
          const result = calculateItem(target, participants, generated);

          expect(result.total).toBe(target.amount);
        }),
      );
    });

    it('모든 부담액은 0 이상의 정수다', () => {
      fc.assert(
        fc.property(arbitraryCase(), ({ participants, item: target, options: generated }) => {
          const result = calculateItem(target, participants, generated);

          for (const share of result.shares) {
            expect(Number.isInteger(share.amount)).toBe(true);
            expect(share.amount).toBeGreaterThanOrEqual(0);
          }
        }),
      );
    });

    it('rounding 값이 결과를 바꾸지 않는다', () => {
      fc.assert(
        fc.property(arbitraryCase(), ({ participants, item: target, options: generated }) => {
          const exact = calculateItem(target, participants, { ...generated, rounding: 'none' });
          const ceiled = calculateItem(target, participants, { ...generated, rounding: 'ceil100' });

          expect(ceiled.shares).toEqual(exact.shares);
        }),
      );
    });

    it('부담자 목록은 participants 순서를 유지하고 중복되지 않는다', () => {
      fc.assert(
        fc.property(arbitraryCase(), ({ participants, item: target, options: generated }) => {
          const result = calculateItem(target, participants, generated);
          const order = result.shares.map((share) =>
            participants.findIndex((p) => p.id === share.participantId),
          );

          expect(order).toEqual([...order].sort((a, b) => a - b));
          expect(new Set(order).size).toBe(order.length);
        }),
      );
    });
  });
});
