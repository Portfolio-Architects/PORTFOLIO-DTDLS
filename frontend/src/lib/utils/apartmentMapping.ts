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
 * 
 * ⚠️ 긴 접두사가 먼저 오도록 정렬 — 가장 구체적인 것부터 매칭
 */
const LOCATION_PREFIXES = [
  // 마을명+동탄 조합 (앱에서 "숲속마을 동탄 X" 형태로 사용)
  '숲속마을동탄', '푸른마을동탄', '나루마을동탄',
  // 시범+마을 조합
  '동탄역시범', '동탄시범다은마을', '동탄시범한빛마을', '동탄시범나루마을',
  '시범다은마을', '시범한빛마을', '시범나루마을', '시범',
  // 마을명 접두사 (앱에서 "예당마을 X", "솔빛마을 X" 형태로 사용)
  '반탄솔빛마을', '솔빛마을', '예당마을', '새강마을',
  // 동탄+위치 조합
  '동탄2신도시', '동탄신도시', '동탄숲속마을', '동탄푸른마을', '동탄나루마을',
  '동탄호수공원역', '동탄호수공원', '동탄호수', '동탄역',
  // 기타
  '화성동탄2', '능동역', '호수공원역',
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
 * 심층 정규화: 다양한 명칭 차이를 통일
 * - "산척동," 등 TX 키의 동명 콤마 접두사 제거
 * - 로마숫자 → 아라비아 (Ⅳ → 4)
 * - "N차" → "N"
 * - "아파트" 접미사 제거
 * - "N번지" → "N"
 * - 소수점 ".0" 제거 (3.0 → 3)
 */
const ROMAN_MAP: Record<string, string> = {
  'Ⅰ': '1', 'Ⅱ': '2', 'Ⅲ': '3', 'Ⅳ': '4', 'Ⅴ': '5',
  'Ⅵ': '6', 'Ⅶ': '7', 'Ⅷ': '8', 'Ⅸ': '9', 'Ⅹ': '10',
};

function deepNormalize(name: string): string {
  let result = name;
  // "동명," 접두사 제거 (TX 키에 "산척동,동탄호수공원..." 형태 있음)
  result = result.replace(/^[가-힣]+,/g, '');
  // 로마숫자 → 아라비아숫자
  for (const [roman, arabic] of Object.entries(ROMAN_MAP)) {
    result = result.replace(roman, arabic);
  }
  // "N차" → "N"
  result = result.replace(/(\d+)차/g, '$1');
  // "아파트" 제거
  result = result.replace(/아파트/g, '');
  // "N번지" → "N"
  result = result.replace(/(\d+)번지/g, '$1');
  // ".0" 제거 (3.0 → 3, but keep 10.0 → 10)
  result = result.replace(/\.0(?=$|[^0-9])/g, '');
  // 명칭 통일 (앱 ↔ 실거래DB 표기 차이)
  result = result.replace(/스위콈/g, '스위첸');
  result = result.replace(/케이씨씨/g, 'KCC');
  return result;
}

/**
 * 3단계 캐스케이딩 매칭으로 TX_SUMMARY / TX_RECORDS 키를 찾는 함수
 * 
 * 1단계: 정규화 후 정확 매칭  
 * 2단계: 양쪽 모두 위치 접두사 제거 후 정확 매칭
 * 3단계: 심층 정규화 (로마숫자, 차, 아파트, 번지, 콤마접두사 등) 후 매칭
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

  for (const key of Object.keys(txMap)) {
    if (stripLocationPrefix(key) === stripped) return key;
  }

  // 3단계: 심층 정규화
  const deepNorm = deepNormalize(stripped);
  for (const key of Object.keys(txMap)) {
    const keyDeep = deepNormalize(stripLocationPrefix(key));
    if (keyDeep === deepNorm) return key;
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
