import { NextResponse } from 'next/server';

import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

const SHEET_TAB = SHEET_TABS.TRANSACTIONS;

// ISR: revalidate every 1 hour (3600s) — 실거래가 데이터는 일 1회 업데이트
export const revalidate = 3600;

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

// ─── In-Memory Cache ─── Stale-While-Revalidate 패턴
let cachedRecords: TransactionRecord[] | null = null;
let cacheTimestamp = 0;
let isRefreshing = false;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분 후 백그라운드 갱신

function extractDong(sigungu: string): string {
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

async function fetchAndParseRecords(): Promise<TransactionRecord[]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  const res = await fetch(csvUrl, { next: { revalidate: 3600 } });

  if (!res.ok) throw new Error('Failed to fetch sheet');

  const csvText = await res.text();
  const lines = csvText.split('\n').filter(l => l.trim());
  const records: TransactionRecord[] = [];

  for (let i = 2; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 15) continue;

    const sigungu = cols[1] || '';
    const priceStr = (cols[9] || '0').replace(/,/g, '');
    const priceNum = parseInt(priceStr, 10) || 0;
    const areaNum = parseFloat(cols[6]) || 0;

    records.push({
      no: parseInt(cols[0], 10) || i,
      sigungu,
      dong: extractDong(sigungu),
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
    });
  }

  records.sort((a, b) => {
    const dateA = `${a.contractYm}${a.contractDay.padStart(2, '0')}`;
    const dateB = `${b.contractYm}${b.contractDay.padStart(2, '0')}`;
    return dateB.localeCompare(dateA);
  });

  cachedRecords = records;
  cacheTimestamp = Date.now();
  console.log(`[TX Cache] Parsed & cached ${records.length} records`);
  return records;
}

async function getAllRecords(): Promise<TransactionRecord[]> {
  const isStale = (Date.now() - cacheTimestamp) > CACHE_TTL_MS;

  // If cache exists (even stale), return immediately + refresh in background
  if (cachedRecords) {
    if (isStale && !isRefreshing) {
      isRefreshing = true;
      fetchAndParseRecords().finally(() => { isRefreshing = false; });
    }
    return cachedRecords;
  }

  // Cold start: must wait for first fetch
  return fetchAndParseRecords();
}

// ─── Warmup ─── 서버 시작 시 즉시 캐시 예열
fetchAndParseRecords().catch(() => {});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aptName = searchParams.get('apt');
    const dong = searchParams.get('dong');

    const allRecords = await getAllRecords();

    // Filter from cached data (instant)
    let filtered = allRecords;
    if (dong) filtered = filtered.filter(r => r.dong === dong);
    if (aptName) filtered = filtered.filter(r => r.aptName.includes(aptName));

    return NextResponse.json({
      total: filtered.length,
      records: filtered,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error: any) {
    console.error('Transaction API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
