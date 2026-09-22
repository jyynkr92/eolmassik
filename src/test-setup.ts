/**
 * Vitest 전역 설정. 컴포넌트 테스트에서 쓰는 DOM matcher 를 등록하고,
 * 테스트끼리 DOM 이 새지 않도록 매 테스트 뒤에 정리한다.
 */

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
