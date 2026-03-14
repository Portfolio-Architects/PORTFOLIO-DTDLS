import { NextRequest, NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';
import { Coord, findNearest, countWithinRadius, parseCoordString } from '@/lib/utils/haversine';

export const revalidate = 86400; // ISR: 24 hours (coordinate data rarely changes)

// ── Types ──────────────────────────────────────────

interface POI extends Coord { name: string; }
interface SchoolPOI extends POI { type: string; }

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

/** apartments 시트: 아파트명 | 좌표 */
async function loadApartments(): Promise<POI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.APARTMENTS);
  const result: POI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, coordStr] = rows[i];
    if (!name || !coordStr) continue;
    const coord = parseCoordString(coordStr);
    if (coord) result.push({ name: name.trim(), ...coord });
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
async function loadStations(): Promise<POI[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.STATIONS);
  const result: POI[] = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, coordStr] = rows[i];
    if (!name || !coordStr) continue;
    const coord = parseCoordString(coordStr);
    if (coord) result.push({ name: name.trim(), ...coord });
  }
  return result;
}

/** academies 시트: 상호명 | 위도 | 경도 | 업종소분류 | 행정동 | 주소 */
async function loadAcademies(): Promise<Coord[]> {
  const rows = await fetchSheetCSV(SHEET_TABS.ACADEMIES);
  const result: Coord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 3) continue;
    const lat = parseFloat(cols[1]);
    const lng = parseFloat(cols[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
      result.push({ lat, lng });
    }
  }
  return result;
}

// ── Apartment Resolver ─────────────────────────────

/** Resolves apartment coordinates by name (exact → partial match). */
function resolveApartmentCoord(name: string, apartments: POI[]): Coord | null {
  const cleanName = name.replace(/\[.*?\]\s*/, '').trim();

  const exact = apartments.find(a => a.name === cleanName || a.name === name);
  if (exact) return { lat: exact.lat, lng: exact.lng };

  const partial = apartments.find(a =>
    cleanName.includes(a.name) || a.name.includes(cleanName)
  );
  if (partial) return { lat: partial.lat, lng: partial.lng };

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

    const aptCoord = resolveApartmentCoord(apartment, apartments);
    if (!aptCoord) {
      return NextResponse.json(
        { error: `Unknown apartment: ${apartment}`, availableApartments: apartments.map(a => a.name) },
        { status: 404 }
      );
    }

    // Calculate distances
    const elementary = schools.filter(s => s.type.includes('초'));
    const middle = schools.filter(s => s.type.includes('중'));
    const high = schools.filter(s => s.type.includes('고'));

    const nearestElementary = findNearest(aptCoord, elementary);
    const nearestMiddle = findNearest(aptCoord, middle);
    const nearestHigh = findNearest(aptCoord, high);
    const nearestStation = findNearest(aptCoord, stations);

    // Academy density: count within 1km radius
    const academyDensity = countWithinRadius(aptCoord, academies, 1000);

    const result = {
      apartmentName: apartment,
      coordinates: aptCoord,
      distanceToElementary: nearestElementary?.distance ?? null,
      distanceToMiddle: nearestMiddle?.distance ?? null,
      distanceToHigh: nearestHigh?.distance ?? null,
      distanceToSubway: nearestStation?.distance ?? null,
      academyDensity,
      nearestSchools: {
        elementary: nearestElementary,
        middle: nearestMiddle,
        high: nearestHigh,
      },
      nearestStation,
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
