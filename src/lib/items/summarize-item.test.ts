import { describe, expect, it } from 'vitest';

import type { ExtraCharge, Item, Participant } from '@/types/settlement';

import { summarizeItem } from './summarize-item';

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

describe('summarizeItem', () => {
  it('추가 부담이 없으면 부담자 수만 센다', () => {
    expect(summarizeItem(item(), participants)).toEqual({ participantCount: 3, charges: [] });
  });

  it('부담자가 없으면 0 이다', () => {
    expect(summarizeItem(item({ participantIds: [] }), participants)).toEqual({
      participantCount: 0,
      charges: [],
    });
  });

  it('금액 지정 부담을 이름과 함께 돌려준다', () => {
    const charges: ExtraCharge[] = [{ participantId: 'p2', type: 'amount', value: 12000 }];

    expect(summarizeItem(item({ extraCharges: charges }), participants).charges).toEqual([
      { participantName: '은정이네', type: 'amount', value: 12000 },
    ]);
  });

  it('전액 부담을 돌려준다', () => {
    const charges: ExtraCharge[] = [{ participantId: 'p2', type: 'full' }];

    expect(summarizeItem(item({ extraCharges: charges }), participants).charges).toEqual([
      { participantName: '은정이네', type: 'full' },
    ]);
  });

  // 0원 부담은 부담이 아니다. 행에 적으면 읽는 사람이 무슨 뜻인지 되묻게 된다
  it('값이 없거나 0 인 금액 부담은 버린다', () => {
    const charges: ExtraCharge[] = [
      { participantId: 'p1', type: 'amount' },
      { participantId: 'p2', type: 'amount', value: 0 },
    ];

    expect(summarizeItem(item({ extraCharges: charges }), participants).charges).toEqual([]);
  });

  // 공유 URL 로 들어온 데이터에는 이미 지워진 참여자를 가리키는 값이 남아 있을 수 있다
  it('참여자 목록에 없는 id 는 세지도 보여주지도 않는다', () => {
    const target = item({
      participantIds: ['p1', 'ghost'],
      extraCharges: [{ participantId: 'ghost', type: 'full' }],
    });

    expect(summarizeItem(target, participants)).toEqual({ participantCount: 1, charges: [] });
  });

  it('여러 명의 추가 부담을 순서대로 담는다', () => {
    const charges: ExtraCharge[] = [
      { participantId: 'p2', type: 'amount', value: 12000 },
      { participantId: 'p3', type: 'full' },
    ];

    expect(summarizeItem(item({ extraCharges: charges }), participants).charges).toEqual([
      { participantName: '은정이네', type: 'amount', value: 12000 },
      { participantName: '지영', type: 'full' },
    ]);
  });
});
