/**
 * URL 인코딩·디코딩 — 기획설계 6.2.
 *
 * 정산 객체 → 키 축약 스키마 → lz-string 압축 → base64url → `/s#<encoded>`
 *
 * 축약 스키마는 이 레이어에만 두고 앱 내부 모델(src/types.ts)은 풀 키를
 * 유지한다. 스키마 맨 앞에는 버전 번호를 넣어 나중에 마이그레이션이
 * 가능하도록 한다. 디코드 결과는 남의 URL에서 온 데이터이므로 Zod로 검증한다.
 *
 * TODO(다음 PR): encodeSettlement / decodeSettlement
 */
export {};
