import { NextResponse } from 'next/server';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

export const revalidate = 3600; // ISR: 1 hour

const SHEETS_CSV_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

interface MindmapNode {
  id: string;
  group: string;
  weight: number;
  color: string;
}

interface MindmapLink {
  source: string;
  target: string;
  strength: number;
}

async function fetchSheetCsv(sheetName: string): Promise<string[][]> {
  const url = `${SHEETS_CSV_BASE}&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return []; // header only → empty
  // Skip header row
  return lines.slice(1).map(line => parseCsvLine(line));
}

export async function GET() {
  try {
    // Fetch nodes and links in parallel
    const [nodeRows, linkRows] = await Promise.all([
      fetchSheetCsv(SHEET_TABS.MINDMAP_NODES),
      fetchSheetCsv(SHEET_TABS.MINDMAP_LINKS),
    ]);

    // Parse nodes: columns = id, group, weight, color
    const nodes: MindmapNode[] = nodeRows
      .filter(row => row[0]?.trim())
      .map(row => ({
        id: row[0]?.trim() || '',
        group: row[1]?.trim() || 'other',
        weight: parseInt(row[2]?.trim() || '5', 10),
        color: row[3]?.trim() || '#8b95a1',
      }));

    // Parse links: columns = source, target, strength
    const links: MindmapLink[] = linkRows
      .filter(row => row[0]?.trim() && row[1]?.trim())
      .map(row => ({
        source: row[0]?.trim() || '',
        target: row[1]?.trim() || '',
        strength: parseFloat(row[2]?.trim() || '0.5'),
      }));

    return NextResponse.json(
      { nodes, links },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error: any) {
    console.error('[mindmap API] Error:', error.message);
    // Return empty data on error (component will show fallback hardcoded data)
    return NextResponse.json({ nodes: [], links: [], error: error.message }, { status: 200 });
  }
}
