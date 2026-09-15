/** 계산 로직 테스트용 픽스처. **테스트 전용 파일이다.** */
import type { Participant } from '@/types/settlement';

/** 이름은 id 를 그대로 쓴다. 테스트에서 이름으로 단언하는 경우가 없다. */
export const participant = (id: string, headcount = 1): Participant => ({
  id,
  name: id,
  headcount,
});
