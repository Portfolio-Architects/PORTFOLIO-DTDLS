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
 * 위치 접두사 제거: 국토교통부 실거래 DB와 앱 이름 간의 접두사 차이 해소
 * "동탄역롯데캐슬알바트로스" → "롯데캐슬알바트로스"
 * "동탄2신도시금강펜테리움" → "금강펜테리움"
 */
const LOCATION_PREFIXES = [
  '동탄역시범', '동탄시범다은마을', '동탄시범한빛마을', '동탄시범나루마을',
  '동탄2신도시', '동탄신도시', '동탄숲속마을', '동탄푸른마을', '동탄나루마을',
  '동탄호수공원', '동탄호수', '동탄역',
  '동탄2', '동탄',
];

function stripLocationPrefix(normalized: string): string {
  for (const prefix of LOCATION_PREFIXES) {
    if (normalized.startsWith(prefix) && normalized.length > prefix.length) {
      return normalized.slice(prefix.length);
    }
  }
  return normalized;
}

/**
 * 2단계 캐스케이딩 매칭으로 TX_SUMMARY / TX_RECORDS 키를 찾는 함수
 * 
 * 1단계: 정규화 후 정확 매칭  
 * 2단계: 양쪽 모두 위치 접두사 제거 후 정확 매칭
 * 
 * @returns 매칭된 키 (없으면 null)
 */
export function findTxKey<T>(aptName: string, txMap: Record<string, T>): string | null {
  const norm = normalizeAptName(aptName);

  // 1단계: 정확 매칭
  if (norm in txMap) return norm;

  // 2단계: 접두사 제거 후 매칭
  const stripped = stripLocationPrefix(norm);
  if (stripped !== norm && stripped in txMap) return stripped;

  // 반대 방향: txMap의 키에서 접두사 제거하여 비교
  for (const key of Object.keys(txMap)) {
    if (stripLocationPrefix(key) === stripped) return key;
  }

  return null;
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
