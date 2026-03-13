/**
 * @module apartmentMapping
 * @description Maps app apartment names (e.g. "[오산동] 힐스테이트 동탄역") 
 * to Google Sheets transaction names (e.g. "힐스테이트동탄역").
 * 
 * 핵심 문제: 앱 보고서 이름과 국토교통부 실거래가 이름이 서로 다름.
 * 해결: 정규화 함수로 양쪽 이름을 통일한 뒤 비교.
 */

/**
 * 아파트명 정규화: 공백, 대괄호 동명, 특수문자 제거
 * "[오산동] 힐스테이트 동탄역" → "힐스테이트동탄역"
 * "힐스테이트동탄역" → "힐스테이트동탄역"
 */
export function normalizeAptName(name: string): string {
  return name
    .replace(/\[.*?\]\s*/g, '')  // [오산동] 제거
    .replace(/\s+/g, '')         // 공백 제거
    .replace(/[()（）]/g, '')     // 괄호 제거
    .trim();
}

/**
 * 두 아파트명이 같은 단지인지 확인 (정확 일치만)
 * "힐스테이트동탄" ≠ "힐스테이트동탄역" (다른 아파트)
 */
export function isSameApartment(reportName: string, txName: string): boolean {
  const a = normalizeAptName(reportName);
  const b = normalizeAptName(txName);
  return a === b;
}

/**
 * 전용면적 → 타입 변환 매핑
 * 아파트별 전용면적을 타입 코드로 변환
 */
const AREA_TYPE_MAP: Record<string, Record<string, string>> = {
  '힐스테이트동탄역': {
    '54.5533': '78A',
    '54.4202': '78B',
    '54.5508': '77C',
    '54.9749': '78D',
  },
};

/**
 * 전용면적(㎡)을 타입명으로 변환.
 * 매핑이 없으면 null 반환.
 */
export function getAreaType(aptName: string, areaStr: string): string | null {
  const normalized = normalizeAptName(aptName);
  const typeMap = AREA_TYPE_MAP[normalized];
  if (!typeMap) return null;
  return typeMap[areaStr] || null;
}
