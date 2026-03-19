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
}

/**
 * GET /api/apartments-by-dong
 * 
 * Google Sheet의 apartments 탭에서 동별로 그룹핑된 아파트 데이터를 반환
 * Sheet 컬럼: 아파트명(0) | 좌표(1) | 세대수(2) | 준공연도(3) | 용적률(4) | 건폐율(5) | 주차대수(6) | 시공사(7) | 동(8)
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

    // 헤더에서 컬럼 인덱스 찾기 (유연하게)
    const header = rows[0]?.map(h => h.toLowerCase().trim()) || [];
    let dongColIdx = header.findIndex(h => h === 'dong' || h === '동');
    if (dongColIdx === -1) dongColIdx = 8; // fallback: 9번째 컬럼
    let floorColIdx = header.findIndex(h => ['최고층', 'maxfloor', 'floors', '층수', '층'].includes(h));
    if (floorColIdx === -1) floorColIdx = 9; // fallback: 10번째 컬럼

    const apartments: SheetApartment[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const name = cols[0]?.trim();
      const coordStr = cols[1]?.trim();
      const dong = cols[dongColIdx]?.trim();

      if (!name || !dong) continue;

      const coord = parseCoordString(coordStr);
      const householdCount = cols[2] ? parseInt(cols[2]) : undefined;
      const parkingCount = cols[6] ? parseInt(cols[6]) : undefined;
      const maxFloor = cols[floorColIdx] ? parseInt(cols[floorColIdx]) : undefined;

      apartments.push({
        name,
        dong,
        lat: coord?.lat || 0,
        lng: coord?.lng || 0,
        householdCount: isNaN(householdCount as number) ? undefined : householdCount,
        yearBuilt: cols[3]?.trim() || undefined,
        far: cols[4] ? parseFloat(cols[4]) || undefined : undefined,
        bcr: cols[5] ? parseFloat(cols[5]) || undefined : undefined,
        parkingCount: isNaN(parkingCount as number) ? undefined : parkingCount,
        brand: cols[7]?.trim() || undefined,
        maxFloor: isNaN(maxFloor as number) ? undefined : maxFloor,
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
