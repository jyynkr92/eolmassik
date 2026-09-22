import type { Settlement } from '@/types/settlement';

export type CodecErrorCode = 'invalid-settlement' | 'invalid-payload' | 'unsupported-version';

export type CodecError = {
  code: CodecErrorCode;
};

export type CodecResult<T> = { success: true; data: T } | { success: false; error: CodecError };

export type DecodeSettlementResult = CodecResult<Settlement>;
