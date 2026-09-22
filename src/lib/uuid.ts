/**
 * UUID v4 를 만든다.
 *
 * `crypto.randomUUID` 는 secure context 전용이라 `http://192.168.x.x:3000` 같은
 * 주소에서는 `undefined` 다. 호출하면 TypeError 가 나고, 모듈 초기화 시점에 부르면
 * 화면이 통째로 빈다. 이 앱은 폰에서 열어보는 게 기본이라 폴백이 필요하다.
 *
 * `crypto.getRandomValues` 는 비보안 컨텍스트에서도 동작하므로 그쪽으로 우회한다.
 */
export const createUuid = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // RFC 4122 — 버전(4)과 variant 비트를 박는다.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
