import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { SHEET_ID, SHEET_TABS } from '@/lib/constants';

export const revalidate = 0; // Disable static caching since data changes often

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

export async function GET() {
  try {
    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Server is missing Google Service Account credentials' }, { status: 500 });
    }

    const formattedKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_TABS.APARTMENTS];
    if (!sheet) return NextResponse.json({ error: `Sheet tab '${SHEET_TABS.APARTMENTS}' not found` }, { status: 500 });

    const rows = await sheet.getRows();
    const apartments: SheetApartment[] = [];

    // Helper to safely extract properties matching header variations
    const getVal = (row: any, keys: string[]) => {
      for (const k of keys) {
        // Case-insensitive exactly
        const exact = sheet.headerValues.find(h => h.toLowerCase().trim() === k.toLowerCase().trim());
        if (exact) {
          const v = row.get(exact);
          if (v !== undefined && v !== null && v !== '') return String(v).trim();
        }
      }
      return undefined;
    };

    for (const r of rows) {
      const name = getVal(r, ['아파트명', 'name', '이름']);
      const dong = getVal(r, ['dong', '동']);
      if (!name || !dong) continue;

      const coordStr = getVal(r, ['좌표', 'coordinates', 'coord']);
      const coord = coordStr ? parseCoordString(coordStr) : null;
      
      const hh = getVal(r, ['세대수', 'householdcount', 'households']);
      const year = getVal(r, ['시공&준공인', '사용승인', '준공연도', 'yearbuilt', '준공']);
      const farStr = getVal(r, ['용적률', 'far']);
      const bcrStr = getVal(r, ['건폐율', 'bcr']);
      const parkStr = getVal(r, ['주차대수', 'parkingcount', '주차']);
      const brand = getVal(r, ['시공사', 'brand', '브랜드']);
      const floorStr = getVal(r, ['최고층', 'maxfloor', 'floors', '층수', '층']);
      const txKey = getVal(r, ['txkey', '실거래키']);
      const rentalStr = getVal(r, ['공공임대', 'public', 'rental', 'ispublicrental']);
      const ticker = getVal(r, ['ticker', '티커']);

      const householdCount = hh ? parseInt(hh.replace(/,/g, '')) : undefined;
      const parkingCount = parkStr ? parseInt(parkStr.replace(/,/g, '')) : undefined;
      const maxFloor = floorStr ? parseInt(floorStr.replace(/,/g, '')) : undefined;

      apartments.push({
        ticker,
        name,
        dong,
        lat: coord?.lat || 0,
        lng: coord?.lng || 0,
        householdCount: isNaN(householdCount as number) ? undefined : householdCount,
        yearBuilt: year,
        far: farStr ? parseFloat(farStr) || undefined : undefined,
        bcr: bcrStr ? parseFloat(bcrStr) || undefined : undefined,
        parkingCount: isNaN(parkingCount as number) ? undefined : parkingCount,
        brand,
        maxFloor: isNaN(maxFloor as number) ? undefined : maxFloor,
        txKey,
        isPublicRental: ['y', 'yes', 'true', 'o', '공공'].includes((rentalStr || '').toLowerCase()),
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
