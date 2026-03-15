import { NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

export const revalidate = 3600; // ISR: 1 hour

const SHEETS_CSV_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

async function fetchSheetCsv(sheetName: string): Promise<string[][]> {
  const url = `${SHEETS_CSV_BASE}&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => parseCsvLine(line));
}

export async function GET() {
  try {
    const [nodeRows, linkRows] = await Promise.all([
      fetchSheetCsv(SHEET_TABS.MINDMAP_NODES),
      fetchSheetCsv(SHEET_TABS.MINDMAP_LINKS),
    ]);

    // Parse nodes: columns = id | label | domain | base_value
    const nodes = nodeRows
      .filter(row => row[0]?.trim())
      .map(row => ({
        id: row[0]?.trim() || '',
        label: row[1]?.trim() || row[0]?.trim() || '',
        domain: row[2]?.trim() || 'REAL_ESTATE',
        base_value: parseInt(row[3]?.trim() || '50', 10),
      }));

    // Parse links: columns = source | target | type | weight
    const links = linkRows
      .filter(row => row[0]?.trim() && row[1]?.trim())
      .map(row => ({
        source: row[0]?.trim() || '',
        target: row[1]?.trim() || '',
        type: row[2]?.trim() || 'CORRELATION',
        weight: parseFloat(row[3]?.trim() || '0.5'),
      }));

    return NextResponse.json(
      { nodes, links },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error: any) {
    console.error('[mindmap API] Error:', error.message);
    return NextResponse.json({ nodes: [], links: [], error: error.message }, { status: 200 });
  }
}
