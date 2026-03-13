import { NextResponse } from 'next/server';

const SHEET_ID = '1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE';
const SHEET_TAB = 'DTDLS';

export const dynamic = 'force-dynamic';

export interface TransactionRecord {
  no: number;
  sigungu: string;
  dong: string; // 행정동 (시군구에서 추출)
  aptName: string;
  area: number; // 전용면적 ㎡
  areaPyeong: number; // 평수
  contractYm: string; // 계약년월 (YYYYMM)
  contractDay: string;
  price: number; // 만원
  priceEok: string; // 억 표시 (e.g. "18억 8,000")
  floor: number;
  buyer: string;
  seller: string;
  buildYear: number;
  roadName: string;
  cancelDate: string;
  dealType: string;
  agentLocation: string;
  registrationDate: string;
  housingType: string;
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

function extractDong(sigungu: string): string {
  // "경기도 화성시 동탄구 능동" → "능동"
  const parts = sigungu.split(' ');
  return parts[parts.length - 1] || '';
}

function formatPriceEok(priceMan: number): string {
  const eok = Math.floor(priceMan / 10000);
  const remainder = priceMan % 10000;
  if (eok === 0) return `${priceMan.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억${remainder.toLocaleString()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aptName = searchParams.get('apt'); // 아파트명 필터 (optional)
    const dong = searchParams.get('dong'); // 동 필터 (optional)

    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
    const res = await fetch(csvUrl, { cache: 'no-store' }); // 항상 최신 데이터

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sheet' }, { status: 502 });
    }

    const csvText = await res.text();
    const lines = csvText.split('\n').filter(l => l.trim());

    // Skip first row (disclaimer) and second row (header)
    // Data starts from row index 2
    const records: TransactionRecord[] = [];

    for (let i = 2; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 15) {
        console.warn(`[TX] Row ${i} skipped: only ${cols.length} cols`, cols.slice(0, 6).join(', '));
        continue;
      }

      const sigungu = cols[1] || '';
      const dongName = extractDong(sigungu);
      const priceStr = (cols[9] || '0').replace(/,/g, '');
      const priceNum = parseInt(priceStr, 10) || 0;
      const areaNum = parseFloat(cols[6]) || 0;

      const record: TransactionRecord = {
        no: parseInt(cols[0], 10) || i,
        sigungu,
        dong: dongName,
        aptName: cols[5] || '',
        area: areaNum,
        areaPyeong: Math.round(areaNum / 3.3058 * 10) / 10,
        contractYm: cols[7] || '',
        contractDay: cols[8] || '',
        price: priceNum,
        priceEok: formatPriceEok(priceNum),
        floor: parseInt(cols[11], 10) || 0,
        buyer: cols[12] || '',
        seller: cols[13] || '',
        buildYear: parseInt(cols[14], 10) || 0,
        roadName: cols[15] || '',
        cancelDate: cols[16] || '-',
        dealType: cols[17] || '',
        agentLocation: cols[18] || '',
        registrationDate: cols[19] || '-',
        housingType: cols[20] || '',
      };

      // Apply filters
      if (dong && dongName !== dong) continue;
      if (aptName && !record.aptName.includes(aptName)) continue;

      records.push(record);
    }

    // Sort by date descending (newest first)
    records.sort((a, b) => {
      const dateA = `${a.contractYm}${a.contractDay.padStart(2, '0')}`;
      const dateB = `${b.contractYm}${b.contractDay.padStart(2, '0')}`;
      return dateB.localeCompare(dateA);
    });

    return NextResponse.json({
      total: records.length,
      records,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    console.error('Transaction API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
