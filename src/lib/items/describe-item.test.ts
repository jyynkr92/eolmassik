import { describe, expect, it } from 'vitest';

import type { ExtraCharge, Item, Participant } from '@/types/settlement';

import { describeItem } from './describe-item';

const participant = (id: string, name: string): Participant => ({ id, name, headcount: 1 });

const participants = [
  participant('p1', '민수'),
  participant('p2', '은정이네'),
  participant('p3', '지영'),
];

const item = (patch: Partial<Item> = {}): Item => ({
  id: 'i1',
  name: '고기',
  amount: 32000,
  payerId: 'p1',
  participantIds: ['p1', 'p2', 'p3'],
  extraCharges: [],
  ...patch,
});

/** 결제자는 예외가 아니어도 항상 맨 앞에 붙는다. */
const payer = (name: string) => ({ kind: 'payer', participantName: name });

describe('describeItem', () => {
  // 부담자 구성은 기본값이면 조용해야 뭔가 적혀 있는 줄이 "여긴 예외" 로 읽힌다
  it('기본값이면 결제자만 알린다', () => {
    expect(describeItem(item(), participants)).toEqual([payer('민수')]);
  });

  describe('결제자', () => {
    // 참여자를 지우면 그 사람을 결제자로 쓰던 항목의 payerId 가 빈 문자열이 된다
    it('결제자가 참여자 목록에 없으면 알린다', () => {
      expect(describeItem(item({ payerId: '' }), participants)).toEqual([{ kind: 'no-payer' }]);
    });

    it('이미 지워진 참여자를 가리켜도 알린다', () => {
      expect(describeItem(item({ payerId: 'ghost' }), participants)).toEqual([
        { kind: 'no-payer' },
      ]);
    });

    it('결제자 문제를 가장 먼저 알린다', () => {
      const target = item({ payerId: '', participantIds: ['p1'] });

      expect(describeItem(target, participants)[0]).toEqual({ kind: 'no-payer' });
    });
  });

  describe('부담자', () => {
    it('일부만 부담하면 인원을 알린다', () => {
      expect(describeItem(item({ participantIds: ['p1', 'p2'] }), participants)).toEqual([
        payer('민수'),
        { kind: 'partial', participantCount: 2 },
      ]);
    });

    // calculateItem 이 부담자가 비면 결제자를 부담자로 세운다. 기획설계 4.1
    // 이름은 바로 앞의 결제자 알림이 말하므로 여기서 다시 적지 않는다
    it('아무도 부담하지 않으면 결제자가 전액을 진다고 알린다', () => {
      expect(describeItem(item({ participantIds: [] }), participants)).toEqual([
        payer('민수'),
        { kind: 'payer-only' },
      ]);
    });

    it('전액 부담자가 따로 있으면 혼자 부담 알림을 띄우지 않는다', () => {
      const target = item({
        participantIds: [],
        extraCharges: [{ participantId: 'p2', type: 'full' }],
      });

      expect(describeItem(target, participants)).toEqual([
        payer('민수'),
        { kind: 'full-charge', participantName: '은정이네' },
      ]);
    });

    // 결제자도 없으면 이 항목은 0원이라 결제자 알림만으로 충분하다
    it('결제자도 부담자도 없으면 결제자 없음만 알린다', () => {
      const target = item({ payerId: '', participantIds: [] });

      expect(describeItem(target, participants)).toEqual([{ kind: 'no-payer' }]);
    });

    // 조작된 데이터에 같은 id 가 두 번 들어 있으면 부담자가 참여자보다 많아진다
    it('중복된 id 는 한 번만 센다', () => {
      const target = item({ participantIds: ['p1', 'p1', 'p2'] });

      expect(describeItem(target, participants)).toEqual([
        payer('민수'),
        { kind: 'partial', participantCount: 2 },
      ]);
    });

    it('참여자 목록에 없는 id 는 세지 않는다', () => {
      const target = item({ participantIds: ['p1', 'ghost'] });

      expect(describeItem(target, participants)).toEqual([
        payer('민수'),
        { kind: 'partial', participantCount: 1 },
      ]);
    });
  });

  describe('추가 부담', () => {
    it('전액 부담을 알린다', () => {
      const charges: ExtraCharge[] = [{ participantId: 'p2', type: 'full' }];

      expect(describeItem(item({ extraCharges: charges }), participants)).toEqual([
        payer('민수'),
        { kind: 'full-charge', participantName: '은정이네' },
      ]);
    });

    it('금액 지정 부담을 알린다', () => {
      const charges: ExtraCharge[] = [{ participantId: 'p2', type: 'amount', value: 12000 }];

      expect(describeItem(item({ extraCharges: charges }), participants)).toEqual([
        payer('민수'),
        { kind: 'amount-charge', participantName: '은정이네', value: 12000 },
      ]);
    });

    // 0원 부담은 부담이 아니다. 행에 적으면 읽는 사람이 무슨 뜻인지 되묻게 된다
    it('값이 없거나 0 인 금액 부담은 버린다', () => {
      const charges: ExtraCharge[] = [
        { participantId: 'p1', type: 'amount' },
        { participantId: 'p2', type: 'amount', value: 0 },
      ];

      expect(describeItem(item({ extraCharges: charges }), participants)).toEqual([payer('민수')]);
    });

    it('이미 지워진 참여자의 추가 부담은 버린다', () => {
      const charges: ExtraCharge[] = [{ participantId: 'ghost', type: 'full' }];

      expect(describeItem(item({ extraCharges: charges }), participants)).toEqual([payer('민수')]);
    });

    it('여러 명의 추가 부담을 순서대로 담는다', () => {
      const charges: ExtraCharge[] = [
        { participantId: 'p2', type: 'amount', value: 12000 },
        { participantId: 'p3', type: 'full' },
      ];

      expect(describeItem(item({ extraCharges: charges }), participants)).toEqual([
        payer('민수'),
        { kind: 'amount-charge', participantName: '은정이네', value: 12000 },
        { kind: 'full-charge', participantName: '지영' },
      ]);
    });
  });
});
