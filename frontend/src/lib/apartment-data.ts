/**
 * 정적 아파트 데이터 — 빌드 타임에 포함되어 API 호출 없이 즉시 사용 가능
 * 
 * ⚠️ 이 파일은 자동 생성됩니다. 직접 수정하지 마세요!
 * 동기화: npm run sync-apartments
 * 마지막 동기화: 2026-04-19
 */

export interface StaticApartment {
  name: string;
  dong: string;
  householdCount?: number;
  yearBuilt?: string;
  brand?: string;
}

/** 동별 아파트 데이터 (정렬됨) */
export const APARTMENTS_BY_DONG: Record<string, StaticApartment[]> = {
  '(주)금강주택': [
    { name: 'MD02', dong: '(주)금강주택', householdCount: 37, yearBuilt: '1195', brand: '1506' },
  ],
  '(주)남흥건설': [
    { name: 'ND05', dong: '(주)남흥건설', householdCount: 37, yearBuilt: '542', brand: '648' },
  ],
  '(주)대우건설': [
    { name: 'YC18', dong: '(주)대우건설', householdCount: 37, yearBuilt: '832', brand: '1048' },
  ],
  '(주)반도건설': [
    { name: 'SC01', dong: '(주)반도건설', householdCount: 37, yearBuilt: '1241', brand: '1365' },
  ],
  '경남건설': [
    { name: 'ND04', dong: '경남건설', householdCount: 37, yearBuilt: '641', brand: '782' },
  ],
  '경남기업(주)': [
    { name: 'ND03', dong: '경남기업(주)', householdCount: 37, yearBuilt: '455', brand: '555' },
  ],
  '금호건설(주)': [
    { name: 'JJ02', dong: '금호건설(주)', householdCount: 37, yearBuilt: '681', brand: '838' },
  ],
  '금호산업(주)': [
    { name: 'JJ01', dong: '금호산업(주)', householdCount: 37, yearBuilt: '812', brand: '885' },
  ],
  '풍성주택(주)': [
    { name: 'YU27', dong: '풍성주택(주)', householdCount: 37, yearBuilt: '538', brand: '551' },
  ],
  '풍성주택주식회사': [
    { name: 'ND07', dong: '풍성주택주식회사', householdCount: 37, yearBuilt: '562', brand: '1043' },
  ],
  '현대건설(주)': [
    { name: 'YC19', dong: '현대건설(주)', householdCount: 37, yearBuilt: '443', brand: '576' },
  ],
};

/** 전체 아파트 수 */
export const TOTAL_APARTMENTS = Object.values(APARTMENTS_BY_DONG).flat().length;
