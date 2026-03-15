/**
 * GET /api/transactions
 * 
 * Firestore 'transactions' 컬렉션에서 실거래가 데이터 조회
 * Query params: apt (아파트명 필터), dong (동 필터)
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export interface TransactionRecord {
  no: number;
  sigungu: string;
  dong: string;
  aptName: string;
  area: number;
  areaPyeong: number;
  contractYm: string;
  contractDay: string;
  price: number;
  priceEok: string;
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

function formatPriceEok(priceMan: number): string {
  const eok = Math.floor(priceMan / 10000);
  const remainder = priceMan % 10000;
  if (eok === 0) return `${priceMan.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억${remainder.toLocaleString()}`;
}

// ─── In-Memory Cache ─── Stale-While-Revalidate 패턴
let cachedRecords: TransactionRecord[] | null = null;
let cacheTimestamp = 0;
let isRefreshing = false;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

async function fetchFromFirestore(): Promise<TransactionRecord[]> {
  const collRef = collection(db, 'transactions');
  const q = query(collRef, orderBy('contractDate', 'desc'));
  const snapshot = await getDocs(q);
  
  const records: TransactionRecord[] = [];
  let idx = 0;
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    records.push({
      no: ++idx,
      sigungu: d.sigungu || '',
      dong: d.dong || '',
      aptName: d.aptName || '',
      area: d.area || 0,
      areaPyeong: d.areaPyeong || 0,
      contractYm: d.contractYm || '',
      contractDay: d.contractDay || '',
      price: d.price || 0,
      priceEok: formatPriceEok(d.price || 0),
      floor: d.floor || 0,
      buyer: d.buyer || '',
      seller: d.seller || '',
      buildYear: d.buildYear || 0,
      roadName: d.roadName || '',
      cancelDate: d.cancelDate || '-',
      dealType: d.dealType || '',
      agentLocation: d.agentLocation || '',
      registrationDate: d.registrationDate || '-',
      housingType: d.housingType || '',
    });
  });

  cachedRecords = records;
  cacheTimestamp = Date.now();
  console.log(`[TX Firestore] Loaded ${records.length} records`);
  return records;
}

async function getAllRecords(): Promise<TransactionRecord[]> {
  const isStale = (Date.now() - cacheTimestamp) > CACHE_TTL_MS;

  if (cachedRecords) {
    if (isStale && !isRefreshing) {
      isRefreshing = true;
      fetchFromFirestore().finally(() => { isRefreshing = false; });
    }
    return cachedRecords;
  }

  return fetchFromFirestore();
}

// Warmup on module load
fetchFromFirestore().catch(() => {});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aptName = searchParams.get('apt');
    const dong = searchParams.get('dong');

    const allRecords = await getAllRecords();

    let filtered = allRecords;
    if (dong) filtered = filtered.filter(r => r.dong === dong);
    if (aptName) filtered = filtered.filter(r => r.aptName.includes(aptName));

    return NextResponse.json({
      total: filtered.length,
      records: filtered,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (error: any) {
    console.error('Transaction API error:', error);
    // Fallback: return empty if Firestore not yet populated
    return NextResponse.json({ total: 0, records: [], error: error.message });
  }
}
