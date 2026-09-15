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
    expect(result.balances).toEqual([
      { participantId: 'p0', paid: 30_000, owed: 20_000, net: 10_000 },
      { participantId: 'p1', paid: 10_000, owed: 20_000, net: -10_000 },
    ]);
    expect(result.transfers).toEqual([{ fromId: 'p1', toId: 'p0', amount: 10_000 }]);
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

  it('참여자 목록에 없는 결제자는 집계하지 않는다', () => {
    const result = calculateSettlement(
      settlement({
        participants: [participant('p0')],
        items: [
          {
            id: 'i0',
            name: '고기',
            amount: 30_000,
            payerId: '유령',
            participantIds: ['p0'],
            extraCharges: [],
          },
        ],
      }),
    );

    expect(result.balances).toEqual([{ participantId: 'p0', paid: 0, owed: 30_000, net: -30_000 }]);
    expect(result.transfers).toEqual([]);
  });

  it('항목이 없으면 전원 순액이 0이다', () => {
    const result = calculateSettlement(settlement({ participants: [participant('p0')] }));

    expect(result.totalAmount).toBe(0);
    expect(result.balances).toEqual([{ participantId: 'p0', paid: 0, owed: 0, net: 0 }]);
    expect(result.transfers).toEqual([]);
  });

  describe('property', () => {
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

    it('송금을 모두 반영하면 올림 초과분만 남고, 건수는 참여자 수보다 적다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated);
          const remaining = [...applyTransfers(result.balances, result.transfers).values()];
          expect(result.transfers.length).toBeLessThanOrEqual(generated.participants.length - 1);
          // 주고받은 총액은 언제나 맞아떨어진다.
          expect(sum(remaining)).toBe(0);
          // 더 보낸 금액의 합이 곧 초과분이고, 그만큼 받는 쪽이 이득을 본다.
          expect(sum(remaining.filter((net) => net > 0))).toBe(result.roundingExcess);
        }),
      );
    });

    it('올림을 켜도 한 사람이 더 보내는 금액은 단위 미만이다', () => {
      fc.assert(
        fc.property(arbitrarySettlement(), (generated) => {
          const result = calculateSettlement(generated);
          const unit = ROUNDING_UNIT[generated.options.rounding];
          for (const [id, sent] of sumSentById(result.transfers)) {
            const owedNet = -(result.balances.find((b) => b.participantId === id)?.net ?? 0);
            expect(sent - owedNet).toBeGreaterThanOrEqual(0);
            expect(sent - owedNet).toBeLessThan(unit);
          }
        }),
      );
    });
  });
});
