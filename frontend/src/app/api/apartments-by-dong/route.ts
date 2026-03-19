import { NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

export const revalidate = 3600; // ISR 1시간

function parseCoordString(s: string): { lat: number; lng: number } | null {
  if (!s) return null;
  const parts = s.split(',').map(p => parseFloat(p.trim()));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { lat: parts[0], lng: parts[1] };
}

export interface SheetApartment {
  ticker?: string;
  name: string;
  dong: string;
  lat: number;
  lng: number;
  householdCount?: number;
  yearBuilt?: string;
  far?: number;
  bcr?: number;
  parkingCount?: number;
  brand?: string;
  maxFloor?: number;
  txKey?: string;
  isPublicRental?: boolean;
}

/**
 * GET /api/apartments-by-dong
 * 
 * Google Sheet의 apartments 탭에서 동별로 그룹핑된 아파트 데이터를 반환
 * 모든 컬럼은 헤더 기반으로 자동 감지 — 컬럼 순서 변경에 영향받지 않음
 */
export async function GET() {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.APARTMENTS)}`;
    const res = await fetch(csvUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sheet' }, { status: 500 });
    }
    const csvText = await res.text();
    const lines = csvText.split('\n').filter(l => l.trim());
    const rows = lines.map(l => parseCsvLine(l));

    // 헤더에서 컬럼 인덱스 찾기 (전부 헤더 기반 — 컬럼 순서 무관)
    const header = rows[0]?.map(h => h.toLowerCase().trim()) || [];
    const col = (names: string[], fallback: number) => {
      const idx = header.findIndex(h => names.includes(h));
      return idx !== -1 ? idx : fallback;
    };

    const nameIdx    = col(['아파트명', 'name', '이름'], 0);
    const coordIdx   = col(['좌표', 'coordinates', 'coord'], 1);
    const hhIdx      = col(['세대수', 'householdcount', 'households'], 2);
    const yearIdx    = col(['시공&준공인', '준공연도', 'yearbuilt', '준공'], 3);
    const farIdx     = col(['용적률', 'far'], 4);
    const bcrIdx     = col(['건폐율', 'bcr'], 5);
    const parkIdx    = col(['주차대수', 'parkingcount', '주차'], 6);
    const brandIdx   = col(['시공사', 'brand', '브랜드'], 7);
    const dongIdx    = col(['dong', '동'], 8);
    const floorIdx   = col(['최고층', 'maxfloor', 'floors', '층수', '층'], 9);
    const txKeyIdx   = col(['txkey', '실거래키'], 10);
    const rentalIdx  = col(['공공임대', 'public', 'rental', 'ispublicrental'], 11);
    const tickerIdx  = col(['ticker', '티커'], 12);

    const apartments: SheetApartment[] = [];

    for (let i = 1; i < rows.length; i++) {
      const c = rows[i];
      const name = c[nameIdx]?.trim();
      const dong = c[dongIdx]?.trim();
      if (!name || !dong) continue;

      const coord = parseCoordString(c[coordIdx]);
      const householdCount = c[hhIdx] ? parseInt(c[hhIdx]) : undefined;
      const parkingCount = c[parkIdx] ? parseInt(c[parkIdx]) : undefined;
      const maxFloor = c[floorIdx] ? parseInt(c[floorIdx]) : undefined;

      apartments.push({
        ticker: c[tickerIdx]?.trim() || undefined,
        name,
        dong,
        lat: coord?.lat || 0,
        lng: coord?.lng || 0,
        householdCount: isNaN(householdCount as number) ? undefined : householdCount,
        yearBuilt: c[yearIdx]?.trim() || undefined,
        far: c[farIdx] ? parseFloat(c[farIdx]) || undefined : undefined,
        bcr: c[bcrIdx] ? parseFloat(c[bcrIdx]) || undefined : undefined,
        parkingCount: isNaN(parkingCount as number) ? undefined : parkingCount,
        brand: c[brandIdx]?.trim() || undefined,
        maxFloor: isNaN(maxFloor as number) ? undefined : maxFloor,
        txKey: c[txKeyIdx]?.trim() || undefined,
        isPublicRental: ['y', 'yes', 'true', 'o', '공공'].includes((c[rentalIdx] || '').trim().toLowerCase()),
      });
    }

    // 동별로 그룹핑
    const byDong: Record<string, SheetApartment[]> = {};
    apartments.forEach(apt => {
      if (!byDong[apt.dong]) byDong[apt.dong] = [];
      byDong[apt.dong].push(apt);
    });

    // 각 동 내에서 이름순 정렬
    Object.values(byDong).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name, 'ko')));

    return NextResponse.json({
      total: apartments.length,
      dongCount: Object.keys(byDong).length,
      byDong,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
