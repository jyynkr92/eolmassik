import { compressToBase64 } from 'lz-string';

import type { CodecResult } from '@/types/codec';
import type { Settlement } from '@/types/settlement';

import { CODEC_VERSION, type CompactSettlement, compactSettlementSchema } from './schema';

const ROUNDING_INDEX = { none: 0, ceil10: 1, ceil100: 2 } as const;
const ABSORBER_INDEX = { payer: 0, split: 1 } as const;
const FULL_SPLIT_INDEX = { even: 0, headcount: 1 } as const;

const toBase64Url = (value: string): string =>
  value.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');

/** 정산을 버전이 포함된 축약 스키마로 바꿔 URL-safe 문자열로 압축한다. */
export const encodeSettlement = (settlement: Settlement): CodecResult<string> => {
  const participantIndexById = new Map(
    settlement.participants.map((participant, index) => [participant.id, index]),
  );
  const defaultPayerIndex =
    settlement.defaultPayerId === null ? null : participantIndexById.get(settlement.defaultPayerId);

  if (defaultPayerIndex === undefined) {
    return { success: false, error: { code: 'invalid-settlement' } };
  }

  const compactItems: CompactSettlement[4] = [];
  for (const item of settlement.items) {
    const payerIndex = participantIndexById.get(item.payerId);
    const participantIndices = item.participantIds.map((id) => participantIndexById.get(id));
    const charges = item.extraCharges.map((charge) => {
      const participantIndex = participantIndexById.get(charge.participantId);
      if (participantIndex === undefined) return undefined;
      if (charge.type === 'full') return [participantIndex, 1] as const;
      if (charge.value === undefined) return undefined;
      return [participantIndex, 0, charge.value] as const;
    });

    if (
      payerIndex === undefined ||
      participantIndices.some((index) => index === undefined) ||
      charges.some((charge) => charge === undefined)
    ) {
      return { success: false, error: { code: 'invalid-settlement' } };
    }

    compactItems.push([
      item.name,
      item.amount,
      payerIndex,
      participantIndices as number[],
      charges as CompactSettlement[4][number][4],
    ]);
  }

  const compact: CompactSettlement = [
    CODEC_VERSION,
    settlement.title,
    settlement.createdAt,
    settlement.participants.map(({ name, headcount }) => [name, headcount]),
    compactItems,
    [
      ROUNDING_INDEX[settlement.options.rounding],
      ABSORBER_INDEX[settlement.options.roundingAbsorber],
      FULL_SPLIT_INDEX[settlement.options.fullChargeSplit],
    ],
    defaultPayerIndex,
  ];
  const parsed = compactSettlementSchema.safeParse(compact);
  if (!parsed.success) return { success: false, error: { code: 'invalid-settlement' } };

  return { success: true, data: toBase64Url(compressToBase64(JSON.stringify(parsed.data))) };
};
