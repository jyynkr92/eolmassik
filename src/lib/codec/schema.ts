import { z } from 'zod';

import { MAX_AMOUNT, MAX_HEADCOUNT } from '@/constants/settlement';
import type { Settlement } from '@/types/settlement';

export const CODEC_VERSION = 1;
export const MAX_ENCODED_LENGTH = 100_000;

const MAX_TEXT_LENGTH = 100;
const MAX_PARTICIPANTS = 100;
const MAX_ITEMS = 500;

const indexSchema = z.number().int().nonnegative();
const amountSchema = z.number().int().min(0).max(MAX_AMOUNT);

const participantSchema = z.tuple([
  z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  z.number().int().min(1).max(MAX_HEADCOUNT),
]);

const amountChargeSchema = z.tuple([indexSchema, z.literal(0), amountSchema]);
const fullChargeSchema = z.tuple([indexSchema, z.literal(1)]);

const itemSchema = z.tuple([
  z.string().max(MAX_TEXT_LENGTH),
  amountSchema,
  indexSchema,
  z.array(indexSchema).max(MAX_PARTICIPANTS),
  z.array(z.union([amountChargeSchema, fullChargeSchema])).max(MAX_PARTICIPANTS),
]);

const optionsSchema = z.tuple([
  z.union([z.literal(0), z.literal(1), z.literal(2)]),
  z.union([z.literal(0), z.literal(1)]),
  z.union([z.literal(0), z.literal(1)]),
]);

export const compactSettlementSchema = z
  .tuple([
    z.literal(CODEC_VERSION),
    z.string().max(MAX_TEXT_LENGTH),
    z.number().int().nonnegative().safe(),
    z.array(participantSchema).min(1).max(MAX_PARTICIPANTS),
    z.array(itemSchema).min(1).max(MAX_ITEMS),
    optionsSchema,
    indexSchema.nullable(),
  ])
  .superRefine((value, context) => {
    const participantCount = value[3].length;
    const items = value[4];
    const defaultPayerIndex = value[6];

    if (defaultPayerIndex !== null && defaultPayerIndex >= participantCount) {
      context.addIssue({ code: 'custom', message: '기본 결제자 참조가 올바르지 않습니다' });
    }

    for (const item of items) {
      const payerIndex = item[2];
      const participantIndices = item[3];
      const extraCharges = item[4];
      const uniqueParticipantIndices = new Set(participantIndices);

      if (payerIndex >= participantCount) {
        context.addIssue({ code: 'custom', message: '결제자 참조가 올바르지 않습니다' });
      }
      if (
        uniqueParticipantIndices.size !== participantIndices.length ||
        participantIndices.some((index) => index >= participantCount)
      ) {
        context.addIssue({ code: 'custom', message: '부담자 참조가 올바르지 않습니다' });
      }

      const chargedIndices = new Set<number>();
      for (const charge of extraCharges) {
        const participantIndex = charge[0];
        if (
          participantIndex >= participantCount ||
          !uniqueParticipantIndices.has(participantIndex) ||
          chargedIndices.has(participantIndex)
        ) {
          context.addIssue({ code: 'custom', message: '추가 부담 참조가 올바르지 않습니다' });
        }
        chargedIndices.add(participantIndex);
      }
    }
  });

export type CompactSettlement = z.infer<typeof compactSettlementSchema>;

const ROUNDING_VALUES = ['none', 'ceil10', 'ceil100'] as const;
const ABSORBER_VALUES = ['payer', 'split'] as const;
const FULL_SPLIT_VALUES = ['even', 'headcount'] as const;

export const expandSettlement = (compact: CompactSettlement): Settlement => {
  const [, title, createdAt, compactParticipants, compactItems, compactOptions, defaultPayerIndex] =
    compact;
  const participants = compactParticipants.map(([name, headcount], index) => ({
    id: `p${index}`,
    name,
    headcount,
  }));

  return {
    id: `shared-${createdAt}`,
    title,
    createdAt,
    participants,
    items: compactItems.map(([name, amount, payerIndex, participantIndices, charges], index) => ({
      id: `i${index}`,
      name,
      amount,
      payerId: participants[payerIndex]?.id ?? '',
      participantIds: participantIndices.map(
        (participantIndex) => participants[participantIndex]?.id ?? '',
      ),
      extraCharges: charges.map((charge) => ({
        participantId: participants[charge[0]]?.id ?? '',
        type: charge[1] === 0 ? ('amount' as const) : ('full' as const),
        ...(charge[1] === 0 && { value: charge[2] }),
      })),
    })),
    options: {
      rounding: ROUNDING_VALUES[compactOptions[0]],
      roundingAbsorber: ABSORBER_VALUES[compactOptions[1]],
      fullChargeSplit: FULL_SPLIT_VALUES[compactOptions[2]],
    },
    defaultPayerId:
      defaultPayerIndex === null ? null : (participants[defaultPayerIndex]?.id ?? null),
  };
};
