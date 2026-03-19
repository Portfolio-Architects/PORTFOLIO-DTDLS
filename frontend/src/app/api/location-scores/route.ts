import { NextRequest, NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';
import { Coord, haversineDistance, findNearest, countWithinRadius, parseCoordString } from '@/lib/utils/haversine';

export const revalidate = 86400; // ISR: 24 hours (coordinate data rarely changes)

// ── Types ──────────────────────────────────────────

interface POI extends Coord { name: string; }
interface SchoolPOI extends POI { type: string; }
interface StationPOI extends POI { line: string; }
interface AcademyPOI extends Coord { category: string; }
interface RestaurantPOI extends Coord { category: string; }
interface ApartmentPOI extends POI {
  householdCount?: number;
  yearBuilt?: string;
  far?: number;
  bcr?: number;
  parkingCount?: number;
  brand?: string;
}

// ── Module-Level In-Memory Cache ───────────────────
// Persists across requests within the same serverless instance.
// Eliminates redundant Google Sheets fetches (biggest CPU saver).

interface CachedData {
  apartments: ApartmentPOI[];
  schools: SchoolPOI[];
  stations: StationPOI[];
  academies: AcademyPOI[];
  restaurants: RestaurantPOI[];
}

let _cache: CachedData | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 3600_000; // 1 hour

async function loadAllCached(): Promise<CachedData> {
  const now = Date.now();
  if (_cache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cache;
  }

  console.log('[LOCATION_SCORES] Cache miss — fetching all sheets...');
  const [apartments, schools, stations, academies, restaurants] = await Promise.all([
    loadApartments(),
    loadSchools(),
    loadStations(),
    loadAcademies(),
    loadRestaurants(),
  ]);

  _cache = { apartments, schools, stations, academies, restaurants };
  _cacheTimestamp = now;
  console.log(`[LOCATION_SCORES] Cache populated: ${apartments.length} apts, ${academies.length} academies, ${restaurants.length} restaurants`);
  return _cache;
}

// ── Bounding Box Pre-Filter ────────────────────────
// ~80% of POIs are eliminated by cheap lat/lng comparison
// before expensive haversine trig calculations.
// 1km ≈ 0.009° latitude; we use 0.012° for safety margin (~1.3km).

const BBOX_DEGREES = 0.012;

function filterByBBox<T extends Coord>(origin: Coord, pois: T[]): T[] {
  return pois.filter(p =>
    Math.abs(p.lat - origin.lat) <= BBOX_DEGREES &&
    Math.abs(p.lng - origin.lng) <= BBOX_DEGREES
  );
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

/** apartments 시트 — 헤더 기반 자동 감지 (컬럼 순서 무관) */
async function loadApartments(): Promise<ApartmentPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.APARTMENTS);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.toLowerCase().trim());
  const col = (names: string[], fallback: number) => {
    const idx = header.findIndex(h => names.includes(h));
    return idx !== -1 ? idx : fallback;
  };
  const nameIdx  = col(['아파트명', 'name', '이름'], 0);
  const coordIdx = col(['좌표', 'coordinates', 'coord'], 1);
  const hhIdx    = col(['세대수', 'householdcount', 'households'], 2);
  const yearIdx  = col(['시공&준공인', '준공연도', 'yearbuilt', '준공'], 3);
  const farIdx   = col(['용적률', 'far'], 4);
  const bcrIdx   = col(['건폐율', 'bcr'], 5);
  const parkIdx  = col(['주차대수', 'parkingcount', '주차'], 6);
  const brandIdx = col(['시공사', 'brand', '브랜드'], 7);

  const result: ApartmentPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const c = rows[i];
    const name = c[nameIdx];
    const coordStr = c[coordIdx];
    if (!name || !coordStr) continue;
    const coord = parseCoordString(coordStr);
    if (!coord) continue;

    const householdCount = c[hhIdx] ? parseInt(c[hhIdx]) : undefined;
    const parkingCount = c[parkIdx] ? parseInt(c[parkIdx]) : undefined;

    result.push({
      name: name.trim(),
      ...coord,
      householdCount: isNaN(householdCount as number) ? undefined : householdCount,
      yearBuilt: c[yearIdx]?.trim() || undefined,
      far: c[farIdx] ? parseFloat(c[farIdx]) || undefined : undefined,
      bcr: c[bcrIdx] ? parseFloat(c[bcrIdx]) || undefined : undefined,
      parkingCount: isNaN(parkingCount as number) ? undefined : parkingCount,
      brand: c[brandIdx]?.trim() || undefined,
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
  return result;
}

/** restaurants 시트: 상호명 | 위도 | 경도 | 업종소분류 | 행정동 | 주소 */
async function loadRestaurants(): Promise<RestaurantPOI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.RESTAURANTS);
  const result: RestaurantPOI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 3) continue;
    const lat = parseFloat(cols[1]);
    const lng = parseFloat(cols[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
      result.push({ lat, lng, category: (cols[3] || '기타').trim() });
    }
  }
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
    // Load from cache (or fetch & cache if stale/empty)
    const { apartments, schools, stations, academies, restaurants } = await loadAllCached();

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
    const gtxSrtLine = stations.filter(s => s.line.includes('GTX') || s.line.includes('SRT'));
    const indeokwonLine = stations.filter(s => s.line.includes('인덕원') || s.line.includes('동탄인덕원'));
    const tramLine = stations.filter(s => s.line.includes('트램') || s.line.includes('동탄트램'));
    const nearestStation = gtxSrtLine.length > 0 ? findNearest(aptCoord, gtxSrtLine) : findNearest(aptCoord, stations);
    const nearestIndeokwon = indeokwonLine.length > 0 ? findNearest(aptCoord, indeokwonLine) : null;
    const nearestTram = tramLine.length > 0 ? findNearest(aptCoord, tramLine) : null;

    // Academy density: bounding box pre-filter → haversine within 1km
    const candidateAcademies = filterByBBox(aptCoord, academies);
    const nearbyAcademies = candidateAcademies.filter(a => haversineDistance(aptCoord, a) <= 1000);
    const academyDensity = nearbyAcademies.length;
    const academyCategories: Record<string, number> = {};
    for (const a of nearbyAcademies) {
      academyCategories[a.category] = (academyCategories[a.category] || 0) + 1;
    }

    // Restaurant/cafe density: bounding box pre-filter → haversine within 1km
    const candidateRestaurants = filterByBBox(aptCoord, restaurants);
    const nearbyRestaurants = candidateRestaurants.filter(r => haversineDistance(aptCoord, r) <= 1000);
    const restaurantDensity = nearbyRestaurants.length;
    const restaurantCategories: Record<string, number> = {};
    for (const r of nearbyRestaurants) {
      restaurantCategories[r.category] = (restaurantCategories[r.category] || 0) + 1;
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
      restaurantDensity,
      restaurantCategories,
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
        totalRestaurants: restaurants.length,
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
