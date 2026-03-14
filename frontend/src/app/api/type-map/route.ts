import { NextResponse } from 'next/server';

const SHEET_ID = '1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE';
const TYPE_MAP_TAB = 'TYPE_MAP';

export const dynamic = 'force-dynamic';

export interface TypeMapEntry {
  aptName: string;
  area: string;
  typeName: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export async function GET() {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TYPE_MAP_TAB)}`;
    const res = await fetch(csvUrl, { cache: 'no-store' });

    if (!res.ok) {
      console.warn('[TYPE_MAP] Sheet fetch failed, using fallback');
      return NextResponse.json({ entries: FALLBACK_MAP });
    }

    const csvText = await res.text();
    const lines = csvText.split('\n').filter(l => l.trim());

    // Header row (row 0): 아파트명, 전용면적, 타입명
    const entries: TypeMapEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 3) continue;
      const aptName = cols[0]?.trim();
      const area = cols[1]?.trim();
      const typeName = cols[2]?.trim();
      if (aptName && area && typeName) {
        entries.push({ aptName, area, typeName });
      }
    }

    // If sheet returned no data, use fallback
    if (entries.length === 0) {
      console.warn('[TYPE_MAP] Sheet returned 0 entries, using fallback');
      return NextResponse.json({ entries: FALLBACK_MAP, source: 'fallback' });
    }

    return NextResponse.json({ entries, source: 'sheet' }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error: any) {
    console.error('[TYPE_MAP] Error:', error.message);
    return NextResponse.json({ entries: FALLBACK_MAP, source: 'fallback' });
  }
}

/** 하드코딩 폴백 (시트 접근 실패 시 사용) */
const FALLBACK_MAP: TypeMapEntry[] = [
  { aptName: '힐스테이트동탄역', area: '54.5533', typeName: '78A' },
  { aptName: '힐스테이트동탄역', area: '54.4202', typeName: '78B' },
  { aptName: '힐스테이트동탄역', area: '54.5508', typeName: '77C' },
  { aptName: '힐스테이트동탄역', area: '54.9749', typeName: '78D' },
];
