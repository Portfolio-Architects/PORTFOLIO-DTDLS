import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { SHEET_ID, SHEET_TABS } from '@/lib/constants';

export const revalidate = 0; // force-dynamic: Google Sheets 인증 실패 시 캐시된 에러 방지

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
  minFloor?: number;
  txKey?: string;
  isPublicRental?: boolean;
  starbucksName?: string;
  starbucksAddress?: string;
  starbucksCoordinates?: string;
  distanceToStarbucks?: number;
  mcdonaldsName?: string;
  mcdonaldsAddress?: string;
  mcdonaldsCoordinates?: string;
  distanceToMcDonalds?: number;
  oliveYoungName?: string;
  oliveYoungAddress?: string;
  oliveYoungCoordinates?: string;
  distanceToOliveYoung?: number;
  daisoName?: string;
  daisoAddress?: string;
  daisoCoordinates?: string;
  distanceToDaiso?: number;
  supermarketName?: string;
  supermarketAddress?: string;
  supermarketCoordinates?: string;
  distanceToSupermarket?: number;
}

export async function GET() {
  try {
    let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Fallback: read from serviceAccountKey.json (same as firebaseAdmin.ts)
    if (!email || !privateKey) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const saPath = path.default.resolve(process.cwd(), 'serviceAccountKey.json');
        const sa = JSON.parse(fs.default.readFileSync(saPath, 'utf-8'));
        email = sa.client_email;
        privateKey = sa.private_key;
      } catch { /* no local file */ }
    }

    if (!email || !privateKey) {
      return NextResponse.json({ error: 'Server is missing Google Service Account credentials' }, { status: 500 });
    }

    const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '');
    const serviceAccountAuth = new JWT({
      email: email,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_TABS.APARTMENTS];
    if (!sheet) return NextResponse.json({ error: `Sheet tab '${SHEET_TABS.APARTMENTS}' not found` }, { status: 500 });

    const rows = await sheet.getRows();
    const apartments: SheetApartment[] = [];

    // Helper to safely extract properties matching header variations (ignoring all spaces and case)
    const getVal = (row: { get: (k: string) => string } & Record<string, string>, keys: string[]) => {
      for (const k of keys) {
        const normalizedK = k.replace(/\s+/g, '').toLowerCase();
        const exact = sheet.headerValues.find(h => h.replace(/\s+/g, '').toLowerCase() === normalizedK);
        if (exact) {
          const v = row.get(exact);
          if (v !== undefined && v !== null && v !== '') return String(v).trim();
        }
      }
      return undefined;
    };

    for (const r of rows) {
      const row = r as unknown as Record<string, unknown>;
      const name = getVal(row as { get: (k: string) => string } & Record<string, string>, ['아파트명', 'name', '이름']);
      const dong = getVal(row as { get: (k: string) => string } & Record<string, string>, ['dong', '동']);
      if (!name || !dong) continue;

      const coordStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['좌표', 'coordinates', 'coord']);
      const coord = coordStr ? parseCoordString(coordStr) : null;
      
      const hh = getVal(row as { get: (k: string) => string } & Record<string, string>, ['세대수', 'householdcount', 'households']);
      const year = getVal(row as { get: (k: string) => string } & Record<string, string>, ['시공&준공인', '사용승인', '준공연도', 'yearbuilt', '준공']);
      const farStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['용적률', 'far']);
      const bcrStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['건폐율', 'bcr']);
      const parkStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['주차대수', 'parkingcount', '주차']);
      const brand = getVal(row as { get: (k: string) => string } & Record<string, string>, ['시공사', 'brand', '브랜드']);
      const floorStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['최고층', 'maxfloor', 'floors', '층수', '층']);
      const minFloorStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['최저층', 'minfloor']);
      const txKey = getVal(row as { get: (k: string) => string } & Record<string, string>, ['txkey', '실거래키']);
      const rentalStr = getVal(row as { get: (k: string) => string } & Record<string, string>, ['공공임대', 'public', 'rental', 'ispublicrental']);
      const ticker = getVal(row as { get: (k: string) => string } & Record<string, string>, ['ticker', '티커']);
      const starbucksName = getVal(row as { get: (k: string) => string } & Record<string, string>, ['스타벅스지점명', '스타벅스 명', '스타벅스 지점', '스타벅스명', '스타벅스이름', 'starbucksname', 'starbucks_name', '지점명']);
      const starbucksAddress = getVal(row as { get: (k: string) => string } & Record<string, string>, ['스타벅스주소', '스타벅스 주소', 'starbucksaddress', 'starbucks_address', '스타벅스상세주소', '상세주소']);
      const starbucksCoordinates = getVal(row as { get: (k: string) => string } & Record<string, string>, ['스타벅스좌표', '스타벅스 좌표', '스타벅스 맵좌표', 'starbuckscoordinates', 'starbucks_coord', 'starbucks_coordinates', '구글맵좌표']);

      const householdCount = hh ? parseInt(hh.replace(/,/g, '')) : undefined;
      const parkingCount = parkStr ? parseInt(parkStr.replace(/,/g, '')) : undefined;
      const maxFloor = floorStr ? parseInt(floorStr.replace(/,/g, '')) : undefined;
      const minFloor = minFloorStr ? parseInt(minFloorStr.replace(/,/g, '')) : undefined;

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
        minFloor: isNaN(minFloor as number) ? undefined : minFloor,
        txKey,
        isPublicRental: ['y', 'yes', 'true', 'o', '공공'].includes((rentalStr || '').toLowerCase()),
        starbucksName,
        starbucksAddress,
        starbucksCoordinates,
      });
    }

    const sboydsSheet = doc.sheetsByTitle[SHEET_TABS.SBOYDS];
    const tenants: Record<string, { name: string, lat: number, lng: number, address: string }[]> = {
      starbucks: [],
      oliveyoung: [],
      daiso: [],
      mcdonalds: [],
      supermarket: []
    };

    if (sboydsSheet) {
      const sbRows = await sboydsSheet.getRows();
      for (const sb of sbRows) {
        const rawName = sb.get('상호명');
        if (!rawName) continue;
        const name = String(rawName).trim();
        const latStr = sb.get('위도');
        const lngStr = sb.get('경도');
        const address = sb.get('주소');
        
        if (latStr && lngStr) {
          const entry = {
            name,
            lat: parseFloat(latStr),
            lng: parseFloat(lngStr),
            address: String(address || '').trim()
          };
          if (name.includes('스타벅스')) tenants.starbucks.push(entry);
          else if (name.includes('올리브영')) tenants.oliveyoung.push(entry);
          else if (name.includes('다이소')) tenants.daiso.push(entry);
        }
      }
    }

    const restSheet = doc.sheetsByTitle[SHEET_TABS.RESTAURANTS];
    if (restSheet) {
      const restRows = await restSheet.getRows();
      for (const sb of restRows) {
        const rawName = sb.get('상호명');
        if (!rawName) continue;
        const name = String(rawName).trim();
        const latStr = sb.get('위도');
        const lngStr = sb.get('경도');
        const address = sb.get('지번주소') || sb.get('도로명주소') || sb.get('주소'); // fallback since restaurants sheet might have different address columns
        
        if (latStr && lngStr) {
          const entry = {
            name,
            lat: parseFloat(latStr),
            lng: parseFloat(lngStr),
            address: String(address || '').trim()
          };
          const cleanName = name.replace(/^(?:\(주\)|주식회사\s*|유한회사\s*)/, '').trim();
          
          if (cleanName.includes('맥도날드')) {
            tenants.mcdonalds.push(entry);
          } else {
            const isSupermarketMatch = /^(이마트|홈플러스|롯데마트|하나로마트|코스트코|트레이더스|노브랜드|스타필드마켓)/.test(cleanName) 
              || /^[가-힣]*농협.*하나로마트/.test(cleanName);
              
            const isSupermarket = isSupermarketMatch 
              && !cleanName.includes('이마트24') 
              && !cleanName.includes('버거') 
              && !cleanName.includes('피자');
              
            if (isSupermarket) {
              tenants.supermarket.push(entry);
            }
          }
        }
      }
    }

    // Haversine formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const p1 = lat1 * Math.PI/180;
      const p2 = lat2 * Math.PI/180;
      const dp = (lat2-lat1) * Math.PI/180;
      const dl = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    for (const apt of apartments) {
      if (apt.lat && apt.lng) {
        const findNearest = (list: typeof tenants.starbucks) => {
          let nearestDist = Infinity;
          let nearestItem = null;
          for (const item of list) {
            const dist = getDistance(apt.lat, apt.lng, item.lat, item.lng);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestItem = item;
            }
          }
          return { item: nearestItem, dist: nearestDist };
        };

        const sb = findNearest(tenants.starbucks);
        if (sb.item) { apt.distanceToStarbucks = Math.round(sb.dist); apt.starbucksName = sb.item.name; apt.starbucksAddress = sb.item.address; apt.starbucksCoordinates = `${sb.item.lat}, ${sb.item.lng}`; }
        
        const oy = findNearest(tenants.oliveyoung);
        if (oy.item) { apt.distanceToOliveYoung = Math.round(oy.dist); apt.oliveYoungName = oy.item.name; apt.oliveYoungAddress = oy.item.address; apt.oliveYoungCoordinates = `${oy.item.lat}, ${oy.item.lng}`; }
        
        const ds = findNearest(tenants.daiso);
        if (ds.item) { apt.distanceToDaiso = Math.round(ds.dist); apt.daisoName = ds.item.name; apt.daisoAddress = ds.item.address; apt.daisoCoordinates = `${ds.item.lat}, ${ds.item.lng}`; }
        
        const mc = findNearest(tenants.mcdonalds);
        if (mc.item) { apt.distanceToMcDonalds = Math.round(mc.dist); apt.mcdonaldsName = mc.item.name; apt.mcdonaldsAddress = mc.item.address; apt.mcdonaldsCoordinates = `${mc.item.lat}, ${mc.item.lng}`; }
        
        const sm = findNearest(tenants.supermarket);
        if (sm.item) { apt.distanceToSupermarket = Math.round(sm.dist); apt.supermarketName = sm.item.name; apt.supermarketAddress = sm.item.address; apt.supermarketCoordinates = `${sm.item.lat}, ${sm.item.lng}`; }
      }
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
  } catch (err: unknown) {
    console.error('[apartments-by-dong] Error:', (err as Error).message, (err as Error).stack?.split('\n')[1]);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
