import { NextRequest, NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

export const revalidate = 86400; // ISR: 24 hours

const BUILDING_API_KEY = process.env.BUILDING_API_KEY || '';
const BUILDING_API_BASE = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';

/** 화성시 법정동 코드 매핑 (sigunguCd: 41590) */
const DONG_CODES: Record<string, string> = {
  '능동': '13000',
  '영천동': '13100',
  '청계동': '12700',
  '신동': '12200',
  '장지동': '12900',
  '반송동': '12400',
  '산척동': '12600',
  '석우동': '12100',
  '송동': '12500',
  '목동': '11900',
  '방교동': '12300',
  '오산동': '12800',
  '중동': '12000',
  '금곡동': '13200',
  '여울동': '13600',
};

interface BuildingInfo {
  householdCount: number | null;   // 세대수
  yearBuilt: string | null;       // 준공연도
  far: number | null;             // 용적률
  bcr: number | null;             // 건폐율
  parkingCount: number | null;    // 총 주차대수
  parkingPerHousehold: number | null; // 세대당 주차대수
}

/**
 * 건축물대장 API에서 아파트 정보 조회
 * 동 이름과 아파트명으로 검색
 */
async function fetchFromBuildingAPI(dongName: string, aptName: string): Promise<BuildingInfo | null> {
  if (!BUILDING_API_KEY) return null;

  // 동 이름에서 코드 찾기
  const dongCode = Object.entries(DONG_CODES).find(([key]) => dongName.includes(key))?.[1];
  if (!dongCode) return null;

  try {
    const url = `${BUILDING_API_BASE}?serviceKey=${encodeURIComponent(BUILDING_API_KEY)}&sigunguCd=41590&bjdongCd=${dongCode}&platGbCd=0&numOfRows=100&pageNo=1&type=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    if (!Array.isArray(items)) return null;

    // 아파트명으로 매칭 (부분 매칭)
    const cleanAptName = aptName.replace(/동탄2?\s*/, '').replace(/\s+/g, '');
    const match = items.find((item: any) => {
      const bldNm = (item.bldNm || '').replace(/\s+/g, '');
      return bldNm.includes(cleanAptName) || cleanAptName.includes(bldNm);
    });

    if (!match) return null;

    const householdCount = Number(match.hhldCnt) || null;
    const parkingCount = Number(match.totPkngCnt) || null;

    return {
      householdCount,
      yearBuilt: match.useAprDay ? String(match.useAprDay).slice(0, 4) : null,
      far: Number(match.vlRat) || null,
      bcr: Number(match.bcRat) || null,
      parkingCount,
      parkingPerHousehold: (householdCount && parkingCount) 
        ? Math.round((parkingCount / householdCount) * 100) / 100 
        : null,
    };
  } catch (e) {
    console.error('[BUILDING_INFO] API Error:', e);
    return null;
  }
}

/**
 * Google Sheet apartments 탭에서 건물 정보 읽기 (폴백)
 * 시트 형식: 아파트명 | 좌표 | 세대수 | 준공연도 | 용적률 | 건폐율 | 주차대수 | 시공사
 */
async function fetchFromSheet(aptName: string): Promise<(BuildingInfo & { brand?: string }) | null> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.APARTMENTS)}`;
  const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const csvText = await res.text();
  const lines = csvText.split('\n').filter(l => l.trim());
  
  const cleanName = aptName.replace(/\[.*?\]\s*/, '').trim();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const sheetName = (cols[0] || '').trim();
    
    if (!sheetName) continue;
    if (sheetName !== cleanName && !cleanName.includes(sheetName) && !sheetName.includes(cleanName)) continue;

    // 컬럼이 3개 이상이면 건물정보도 포함된 것
    if (cols.length < 3) return null;

    const householdCount = Number(cols[2]) || null;
    const parkingRaw = Number(cols[6]) || null;

    return {
      householdCount,
      yearBuilt: cols[3]?.trim() || null,
      far: Number(cols[4]) || null,
      bcr: Number(cols[5]) || null,
      parkingCount: parkingRaw,
      parkingPerHousehold: (householdCount && parkingRaw) 
        ? Math.round((parkingRaw / householdCount) * 100) / 100 
        : null,
      brand: cols[7]?.trim() || undefined,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const apartment = request.nextUrl.searchParams.get('apartment');
  const dong = request.nextUrl.searchParams.get('dong') || '';

  if (!apartment) {
    return NextResponse.json({ error: 'apartment parameter required' }, { status: 400 });
  }

  // 1차: 건축물대장 API 시도
  let info = await fetchFromBuildingAPI(dong, apartment);
  let source = 'api';

  // 2차: 시트 폴백
  if (!info) {
    const sheetInfo = await fetchFromSheet(apartment);
    if (sheetInfo) {
      info = sheetInfo;
      source = 'sheet';
    }
  }

  if (!info) {
    return NextResponse.json(
      { error: `Building info not found: ${apartment}`, source: 'none' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    apartmentName: apartment,
    ...info,
    source,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' },
  });
}
