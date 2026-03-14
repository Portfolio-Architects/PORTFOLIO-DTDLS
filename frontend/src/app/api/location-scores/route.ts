import { NextRequest, NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';
import { Coord, haversineDistance, findNearest, countWithinRadius, parseCoordString } from '@/lib/utils/haversine';

export const revalidate = 86400; // ISR: 24 hours (coordinate data rarely changes)

// ── Types ──────────────────────────────────────────

interface POI extends Coord { name: string; }
interface SchoolPOI extends POI { type: string; }
interface StationPOI extends POI { line: string; }
interface AcademyPOI extends Coord { category: string; }
interface ApartmentPOI extends POI {
  householdCount?: number;
  yearBuilt?: string;
  far?: number;
  bcr?: number;
  parkingCount?: number;
  brand?: string;
}

// ── Google Sheet Loaders ───────────────────────────

/** Fetches CSV data from a Google Sheet tab. */
async function fetchSheetCSV(tabName: string): Promise<string[][]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const csvText = await res.text();
  const lines = csvText.split('\n').filter(l => l.trim());
  return lines.map(l => parseCsvLine(l));
}

/** apartments 시트: 아파트명 | 좌표 | 세대수 | 준공연도 | 용적률 | 건폐율 | 주차대수 | 시공사 */
async function loadApartments(): Promise<ApartmentPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.APARTMENTS);
  const result: ApartmentPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const name = cols[0];
    const coordStr = cols[1];
    if (!name || !coordStr) continue;
    const coord = parseCoordString(coordStr);
    if (!coord) continue;

    const householdCount = cols[2] ? parseInt(cols[2]) : undefined;
    const parkingCount = cols[6] ? parseInt(cols[6]) : undefined;

    result.push({
      name: name.trim(),
      ...coord,
      householdCount: isNaN(householdCount as number) ? undefined : householdCount,
      yearBuilt: cols[3]?.trim() || undefined,
      far: cols[4] ? parseFloat(cols[4]) || undefined : undefined,
      bcr: cols[5] ? parseFloat(cols[5]) || undefined : undefined,
      parkingCount: isNaN(parkingCount as number) ? undefined : parkingCount,
      brand: cols[7]?.trim() || undefined,
    });
  }
  return result;
}

/** schools 시트: 학교명 | 좌표 | 구분 */
async function loadSchools(): Promise<SchoolPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.SCHOOLS);
  const result: SchoolPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, coordStr, type] = rows[i];
    if (!name || !coordStr || !type) continue;
    const coord = parseCoordString(coordStr);
    if (coord) result.push({ name: name.trim(), ...coord, type: type.trim() });
  }
  return result;
}

/** stations 시트: 역명 | 좌표 | 노선 */
async function loadStations(): Promise<StationPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.STATIONS);
  const result: StationPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols[0] || !cols[1]) continue;
    const coord = parseCoordString(cols[1]);
    if (coord) result.push({ name: cols[0].trim(), ...coord, line: (cols[2] || '').trim() });
  }
  return result;
}

/** academies 시트: 상호명 | 위도 | 경도 | 업종소분류 | 행정동 | 주소 */
async function loadAcademies(): Promise<AcademyPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.ACADEMIES);
  const result: AcademyPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 3) continue;
    const lat = parseFloat(cols[1]);
    const lng = parseFloat(cols[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
      result.push({ lat, lng, category: (cols[3] || '기타').trim() });
    }
  }
  console.log(`[LOCATION_SCORES] Loaded ${result.length} academies`);
  return result;
}

// ── Apartment Resolver ─────────────────────────────

/** Resolves apartment coordinates and building info by name. */
function resolveApartment(name: string, apartments: ApartmentPOI[]): ApartmentPOI | null {
  const cleanName = name.replace(/\[.*?\]\s*/, '').trim();
  const norm = (s: string) => s.replace(/\s/g, '');

  // 1) Exact match
  const exact = apartments.find(a => a.name === cleanName || a.name === name);
  if (exact) return exact;

  // 2) Whitespace-normalized match (힐스테이트동탄역 ↔ 힐스테이트 동탄역)
  const normalized = apartments.find(a => norm(a.name) === norm(cleanName));
  if (normalized) return normalized;

  // 3) Partial match (contains)
  const partial = apartments.find(a =>
    cleanName.includes(a.name) || a.name.includes(cleanName)
  );
  if (partial) return partial;

  // 4) Partial normalized match
  const partialNorm = apartments.find(a =>
    norm(cleanName).includes(norm(a.name)) || norm(a.name).includes(norm(cleanName))
  );
  if (partialNorm) return partialNorm;

  return null;
}

// ── GET Handler ────────────────────────────────────

export async function GET(request: NextRequest) {
  const apartment = request.nextUrl.searchParams.get('apartment');

  if (!apartment) {
    return NextResponse.json({ error: 'apartment parameter is required' }, { status: 400 });
  }

  try {
    // Load all data in parallel
    const [apartments, schools, stations, academies] = await Promise.all([
      loadApartments(),
      loadSchools(),
      loadStations(),
      loadAcademies(),
    ]);

    const apt = resolveApartment(apartment, apartments);
    if (!apt) {
      return NextResponse.json(
        { error: `Unknown apartment: ${apartment}`, availableApartments: apartments.map(a => a.name) },
        { status: 404 }
      );
    }

    const aptCoord: Coord = { lat: apt.lat, lng: apt.lng };

    // Calculate school distances
    const elementary = schools.filter(s => s.type.includes('초'));
    const middle = schools.filter(s => s.type.includes('중'));
    const high = schools.filter(s => s.type.includes('고'));

    const nearestElementary = findNearest(aptCoord, elementary);
    const nearestMiddle = findNearest(aptCoord, middle);
    const nearestHigh = findNearest(aptCoord, high);

    // Station distances by line type
    const nearestStation = findNearest(aptCoord, stations);
    const indeokwonLine = stations.filter(s => s.line.includes('인덕원') || s.line.includes('동탄인덕원'));
    const tramLine = stations.filter(s => s.line.includes('트램') || s.line.includes('동탄트램'));
    const nearestIndeokwon = indeokwonLine.length > 0 ? findNearest(aptCoord, indeokwonLine) : null;
    const nearestTram = tramLine.length > 0 ? findNearest(aptCoord, tramLine) : null;

    // Academy density: count within 1km radius with category breakdown
    const nearbyAcademies = academies.filter(a => haversineDistance(aptCoord, a) <= 1000);
    const academyDensity = nearbyAcademies.length;
    const academyCategories: Record<string, number> = {};
    for (const a of nearbyAcademies) {
      academyCategories[a.category] = (academyCategories[a.category] || 0) + 1;
    }

    // Parking per household
    const parkingPerHousehold = (apt.householdCount && apt.parkingCount)
      ? Math.round((apt.parkingCount / apt.householdCount) * 100) / 100
      : null;

    const result = {
      apartmentName: apartment,
      coordinates: aptCoord,
      distanceToElementary: nearestElementary?.distance ?? null,
      distanceToMiddle: nearestMiddle?.distance ?? null,
      distanceToHigh: nearestHigh?.distance ?? null,
      distanceToSubway: nearestStation?.distance ?? null,
      distanceToIndeokwon: nearestIndeokwon?.distance ?? null,
      distanceToTram: nearestTram?.distance ?? null,
      academyDensity,
      academyCategories,
      // Building info from sheet
      buildingInfo: {
        householdCount: apt.householdCount ?? null,
        yearBuilt: apt.yearBuilt ?? null,
        far: apt.far ?? null,
        bcr: apt.bcr ?? null,
        parkingPerHousehold,
        brand: apt.brand ?? null,
      },
      nearestSchools: {
        elementary: nearestElementary,
        middle: nearestMiddle,
        high: nearestHigh,
      },
      nearestStation,
      nearestIndeokwon,
      nearestTram,
      meta: {
        totalSchools: schools.length,
        totalStations: stations.length,
        totalAcademies: academies.length,
        totalApartments: apartments.length,
      },
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LOCATION_SCORES] Error:', msg);
    return NextResponse.json(
      { error: 'Failed to calculate location scores', detail: msg },
      { status: 500 }
    );
  }
}
