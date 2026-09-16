/**
 * Settlement 변환 함수 — `(settlement, ...args) => Settlement` 형태의 순수 함수만 둔다.
 *
 * 스토어에서 분리해 둔 이유는 두 가지다. 참여자 삭제처럼 여러 필드를 동시에 건드리는
 * 규칙을 zustand 없이 단위 테스트로 고정할 수 있고, 스토어 파일이 조립만 하게 되어
 * 규칙이 어디 있는지 찾기 쉽다.
 *
 * 대상이 없으면 **원본 객체를 그대로 반환**한다. 새 객체를 만들면 selector 가 바뀐 줄 알고
 * 리렌더를 일으킨다.
 */
import { createUuid } from '@/lib/uuid';
import type { ExtraCharge, Item, Options, Participant, Settlement } from '@/types/settlement';

/** 항목 하나만 바꾼다. 해당 id 가 없으면 원본을 그대로 돌려준다. */
const replaceItem = (
  settlement: Settlement,
  itemId: string,
  update: (item: Item) => Item,
): Settlement => {
  const target = settlement.items.find((item) => item.id === itemId);
  if (!target) return settlement;

  const updated = update(target);
  if (updated === target) return settlement;

  const items = settlement.items.map((item) => (item.id === itemId ? updated : item));
  return { ...settlement, items };
};

export const setTitleIn = (settlement: Settlement, title: string): Settlement => ({
  ...settlement,
  title,
});

export const setDefaultPayerIdIn = (
  settlement: Settlement,
  defaultPayerId: string | null,
): Settlement => ({ ...settlement, defaultPayerId });

export const setOptionsIn = (settlement: Settlement, patch: Partial<Options>): Settlement => ({
  ...settlement,
  options: { ...settlement.options, ...patch },
});

/**
 * 참여자를 추가한다.
 *
 * 기본 결제자가 아직 없으면 이 사람으로 정한다. 정산을 만드는 사람이 먼저 자기 이름을
 * 넣고 본인이 결제자인 경우가 대부분이라, 매번 고르게 하는 것보다 자연스럽다.
 * 기획설계 9 — 결정 기록 7
 */
export const addParticipantTo = (settlement: Settlement, name: string): Settlement => {
  const participant: Participant = { id: createUuid(), name, headcount: 1 };
  const participants = [...settlement.participants, participant];

  const defaultPayerId = settlement.defaultPayerId ?? participant.id;
  return { ...settlement, participants, defaultPayerId };
};

export const updateParticipantIn = (
  settlement: Settlement,
  participantId: string,
  patch: Partial<Omit<Participant, 'id'>>,
): Settlement => {
  const target = settlement.participants.find((participant) => participant.id === participantId);
  if (!target) return settlement;

  const participants = settlement.participants.map((participant) =>
    participant.id === participantId ? { ...participant, ...patch } : participant,
  );
  return { ...settlement, participants };
};

/**
 * 참여자를 지우고, 이 사람을 가리키던 참조를 전부 정리한다.
 *
 * 참조는 항목의 `payerId`, `participantIds`, `extraCharges` 세 군데에 있다. 하나라도
 * 남으면 없는 사람에게 부담액이 잡히거나, 결제자가 참여자 목록에 없어서 항목 전체가
 * `invalidItemIds` 로 빠진다.
 *
 * 결제자 자리는 새 기본 결제자로 메운다. 남은 참여자가 없으면 빈 문자열이 되고, 그 항목은
 * 결과 화면에서 "결제자를 정해주세요" 로 드러난다. 조용히 버리지 않는다.
 */
export const removeParticipantFrom = (
  settlement: Settlement,
  participantId: string,
): Settlement => {
  const participants = settlement.participants.filter(
    (participant) => participant.id !== participantId,
  );
  if (participants.length === settlement.participants.length) return settlement;

  const defaultPayerId =
    settlement.defaultPayerId === participantId
      ? (participants[0]?.id ?? null)
      : settlement.defaultPayerId;

  const items = settlement.items.map((item) => ({
    ...item,
    payerId: item.payerId === participantId ? (defaultPayerId ?? '') : item.payerId,
    participantIds: item.participantIds.filter((id) => id !== participantId),
    extraCharges: item.extraCharges.filter((charge) => charge.participantId !== participantId),
  }));

  return { ...settlement, participants, items, defaultPayerId };
};

/**
 * 항목을 추가한다. 기본값은 **전원 참여**다.
 * 빼는 게 더하는 것보다 빈도가 높다. 기획설계 5.3
 */
export const addItemTo = (settlement: Settlement, name = ''): Settlement => {
  const item: Item = {
    id: createUuid(),
    name,
    amount: 0,
    payerId: settlement.defaultPayerId ?? '',
    participantIds: settlement.participants.map((participant) => participant.id),
    extraCharges: [],
  };
  return { ...settlement, items: [...settlement.items, item] };
};

export const updateItemIn = (
  settlement: Settlement,
  itemId: string,
  patch: Partial<Omit<Item, 'id'>>,
): Settlement => replaceItem(settlement, itemId, (item) => ({ ...item, ...patch }));

export const removeItemFrom = (settlement: Settlement, itemId: string): Settlement => {
  const items = settlement.items.filter((item) => item.id !== itemId);
  if (items.length === settlement.items.length) return settlement;

  return { ...settlement, items };
};

/**
 * 항목의 부담자를 토글한다. 기획설계 5.4
 *
 * 넣을 때는 `participants` 배열 순서에 맞춰 끼워 넣는다. 부담자 목록의 순서가 화면의
 * 참여자 순서와 어긋나면 결과 화면에서 사람 순서가 항목마다 뒤바뀐다.
 */
export const toggleItemParticipantIn = (
  settlement: Settlement,
  itemId: string,
  participantId: string,
): Settlement => {
  const isParticipant = settlement.participants.some(
    (participant) => participant.id === participantId,
  );
  if (!isParticipant) return settlement;

  return replaceItem(settlement, itemId, (item) => {
    if (item.participantIds.includes(participantId)) {
      return {
        ...item,
        participantIds: item.participantIds.filter((id) => id !== participantId),
      };
    }

    const next = [...item.participantIds, participantId];
    const participantIds = settlement.participants
      .map((participant) => participant.id)
      .filter((id) => next.includes(id));
    return { ...item, participantIds };
  });
};

/**
 * 추가 부담을 넣거나 바꾼다. 한 사람이 한 항목에 두 번 추가 부담할 일은 없으므로
 * `participantId` 기준으로 upsert 한다. 기획설계 3.4
 */
export const setExtraChargeIn = (
  settlement: Settlement,
  itemId: string,
  charge: ExtraCharge,
): Settlement =>
  replaceItem(settlement, itemId, (item) => {
    const hasCharge = item.extraCharges.some(
      (extraCharge) => extraCharge.participantId === charge.participantId,
    );
    if (!hasCharge) return { ...item, extraCharges: [...item.extraCharges, charge] };

    const extraCharges = item.extraCharges.map((extraCharge) =>
      extraCharge.participantId === charge.participantId ? charge : extraCharge,
    );
    return { ...item, extraCharges };
  });

export const removeExtraChargeFrom = (
  settlement: Settlement,
  itemId: string,
  participantId: string,
): Settlement =>
  replaceItem(settlement, itemId, (item) => {
    const extraCharges = item.extraCharges.filter(
      (charge) => charge.participantId !== participantId,
    );
    if (extraCharges.length === item.extraCharges.length) return item;

    return { ...item, extraCharges };
  });
