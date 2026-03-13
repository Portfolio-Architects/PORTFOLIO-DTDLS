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
 * 두 아파트명이 같은 단지인지 확인
 */
export function isSameApartment(reportName: string, txName: string): boolean {
  const a = normalizeAptName(reportName);
  const b = normalizeAptName(txName);
  
  // 완전 일치
  if (a === b) return true;
  
  // 한쪽이 다른 쪽을 포함 (긴 이름이 짧은 이름을 포함)
  if (a.length > 3 && b.length > 3) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  
  return false;
}
