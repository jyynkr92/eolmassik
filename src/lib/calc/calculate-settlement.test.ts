import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS, ROUNDING_UNIT } from '@/constants/settlement';
import type { Settlement } from '@/types/settlement';

import { arbitrarySettlement } from './arbitraries.test-helper';
import { calculateSettlement } from './calculate-settlement';
import { participant } from './fixtures.test-helper';
import { applyTransfers, sumSentById } from './transfers.test-helper';

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const settlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  id: 's0',
  title: '9/15 캠핑',
  createdAt: 0,
  participants: [],
  items: [],
  options: DEFAULT_OPTIONS,
  defaultPayerId: null,
  ...overrides,
});

describe('calculateSettlement', () => {
  it('결제자와 부담자를 분리해 순액과 송금을 낸다', () => {
    const result = calculateSettlement(
      settlement({
        participants: [participant('p0'), participant('p1')],
        items: [
          {
            id: 'i0',
            name: '고기',
            amount: 30_000,
            payerId: 'p0',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
          {
            id: 'i1',
            name: '음료',
            amount: 10_000,
            payerId: 'p1',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
        ],
      }),
    );

    expect(result.totalAmount).toBe(40_000);
    expect(result.invalidItemIds).toEqual([]);
    expect(result.balances).toEqual([
      { participantId: 'p0', paid: 30_000, owed: 20_000, net: 10_000 },
      { participantId: 'p1', paid: 10_000, owed: 20_000, net: -10_000 },
    ]);
    expect(result.transfers).toEqual([{ fromId: 'p1', toId: 'p0', amount: 10_000 }]);
  });

  it('고기·숙소·장보기의 전체 순액을 상계해 송금한다', () => {
    const result = calculateSettlement(
      settlement({
        participants: [participant('eunjeong'), participant('hi'), participant('ppyong')],
        items: [
          {
            id: 'meat',
            name: '고기',
            amount: 42_000,
            payerId: 'eunjeong',
            participantIds: ['eunjeong', 'hi', 'ppyong'],
            extraCharges: [{ participantId: 'ppyong', type: 'amount', value: 3_000 }],
          },
          {
            id: 'stay',
            name: '숙소',
            amount: 240_000,
            payerId: 'hi',
            participantIds: ['eunjeong', 'hi', 'ppyong'],
            extraCharges: [],
          },
          {
            id: 'market',
            name: '장보기',
            amount: 54_690,
            payerId: 'eunjeong',
            participantIds: ['eunjeong', 'hi', 'ppyong'],
            extraCharges: [],
          },
        ],
      }),
    );

    expect(result.transfers).toEqual([
      { fromId: 'ppyong', toId: 'hi', amount: 114_230 },
      { fromId: 'eunjeong', toId: 'hi', amount: 14_540 },
    ]);
  });

  it('돗자리 결제액을 본인 총 부담에서 빼고 나머지만 피자 결제자에게 보낸다', () => {
    const participants = [
      participant('eunjeong'),
      participant('p1'),
      participant('p2'),
      participant('p3'),
      participant('hi'),
    ];
    const participantIds = participants.map(({ id }) => id);
    const result = calculateSettlement(
      settlement({
        participants,
        items: [
          {
            id: 'mat',
            name: '돗자리',
            amount: 5_000,
            payerId: 'eunjeong',
            participantIds,
            extraCharges: [],
          },
          {
            id: 'pizza',
            name: '피자',
            amount: 54_300,
            payerId: 'hi',
            participantIds,
            extraCharges: [],
          },
        ],
      }),
    );

    expect(result.transfers).toEqual([
      { fromId: 'p1', toId: 'hi', amount: 11_860 },
      { fromId: 'p2', toId: 'hi', amount: 11_860 },
      { fromId: 'p3', toId: 'hi', amount: 11_860 },
      { fromId: 'eunjeong', toId: 'hi', amount: 6_860 },
    ]);
  });

  it('올림이 항목 수만큼 누적되지 않는다', () => {
    // 10,000원 항목 3개를 3명이 나누면 정확히 1인 10,000원이다.
    // 항목 단위로 올리면 1인 10,200원이 되어 항목 수만큼 손해가 쌓인다. 기획설계 4.3
    const participants = [participant('p0'), participant('p1'), participant('p2')];
    const result = calculateSettlement(
      settlement({
        participants,
        items: [0, 1, 2].map((index) => ({
          id: `i${index}`,
          name: `항목${index}`,
          amount: 10_000,
          payerId: 'p0',
          participantIds: ['p0', 'p1', 'p2'],
          extraCharges: [],
        })),
        options: { ...DEFAULT_OPTIONS, rounding: 'ceil100' },
      }),
    );

    expect(result.totalAmount).toBe(30_000);
    expect(result.transfers).toEqual([
      { fromId: 'p1', toId: 'p0', amount: 10_000 },
      { fromId: 'p2', toId: 'p0', amount: 10_000 },
    ]);
    // 결제자는 30,000원을 내고 20,000원을 돌려받아 10,000원만 부담한다.
    expect(result.roundingExcess).toBe(2);
  });

  it('결제자가 참여자 목록에 없는 항목은 정산에서 빼고 id 로 알린다', () => {
    // 결제액을 낼 사람이 없는데 부담만 시키면 보낼 곳 없는 빚이 생긴다.
    const result = calculateSettlement(
      settlement({
        participants: [participant('p0'), participant('p1')],
        items: [
          {
            id: 'i0',
            name: '고기',
            amount: 30_000,
            payerId: '유령',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
          {
            id: 'i1',
            name: '음료',
            amount: 10_000,
            payerId: 'p0',
            participantIds: ['p0', 'p1'],
            extraCharges: [],
          },
        ],
      }),
    );

    expect(result.invalidItemIds).toEqual(['i0']);
    expect(result.itemResults.map((item) => item.itemId)).toEqual(['i1']);
    expect(result.totalAmount).toBe(10_000);
    expect(result.balances).toEqual([
      { participantId: 'p0', paid: 10_000, owed: 5_000, net: 5_000 },
      { participantId: 'p1', paid: 0, owed: 5_000, net: -5_000 },
    ]);
    expect(result.transfers).toEqual([{ fromId: 'p1', toId: 'p0', amount: 5_000 }]);
  });

  it('항목이 없으면 전원 순액이 0이다', () => {
    const result = calculateSettlement(settlement({ participants: [participant('p0')] }));

    expect(result.totalAmount).toBe(0);
    expect(result.balances).toEqual([{ participantId: 'p0', paid: 0, owed: 0, net: 0 }]);
    expect(result.transfers).toEqual([]);
  });

  describe('property', () => {
    it('제외된 항목과 반영된 항목을 합치면 원래 항목 수와 같다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated);

          expect(result.itemResults.length + result.invalidItemIds.length).toBe(
            generated.items.length,
          );
        }),
      );
    });

    it('전체 부담액의 합 == 전체 결제액의 합 == 총액', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated);

          expect(sum(result.balances.map((balance) => balance.owed))).toBe(result.totalAmount);
          expect(sum(result.balances.map((balance) => balance.paid))).toBe(result.totalAmount);
          expect(sum(result.balances.map((balance) => balance.net))).toBe(0);
        }),
      );
    });

    it('정확 송금을 모두 반영하면 잔액이 0이고, 송금은 참여자 수보다 적다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const exact = calculateSettlement({
            ...generated,
            options: { ...generated.options, rounding: 'none' },
          });
          const remaining = [...applyTransfers(exact.balances, exact.transfers).values()];
          const participantCount = generated.participants.length;
          expect(exact.transfers.length).toBeLessThanOrEqual(participantCount - 1);
          expect(remaining.every((net) => net === 0)).toBe(true);
        }),
      );
    });

    it('올림을 켜도 한 사람이 정확 송금보다 더 보내는 금액은 단위 미만이다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated);
          const exact = calculateSettlement({
            ...generated,
            options: { ...generated.options, rounding: 'none' },
          });
          const unit = ROUNDING_UNIT[generated.options.rounding];
          const exactSentById = sumSentById(exact.transfers);
          const roundedSentById = sumSentById(result.transfers);

          for (const participant of generated.participants) {
            const gap =
              (roundedSentById.get(participant.id) ?? 0) - (exactSentById.get(participant.id) ?? 0);
            expect(gap).toBeGreaterThanOrEqual(0);
            expect(gap).toBeLessThan(unit);
          }

          expect(
            sum(result.transfers.map(({ amount }) => amount)) -
              sum(exact.transfers.map(({ amount }) => amount)),
          ).toBe(result.roundingExcess);
        }),
      );
    });
  });
});
