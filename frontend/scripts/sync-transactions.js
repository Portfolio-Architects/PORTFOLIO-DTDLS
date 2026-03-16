#!/usr/bin/env node
/**
 * 🔄 Firestore → transaction-summary.ts 동기화 스크립트
 * 
 * 사용법: npm run sync-transactions
 * 
 * Firestore 'transactions' 컬렉션에서 실거래가 데이터를 읽어
 * 아파트별 요약 (최근가, 최고가, 최저가, 건수, 최근 3건)을
 * frontend/src/lib/transaction-summary.ts 파일로 자동 생성합니다.
 * 
 * → Vercel CPU 사용 0, 메인 페이지 즉시 렌더링
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/transaction-summary.ts');

// Firebase config (public)
const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
  messagingSenderId: "294879479843",
  appId: "1:294879479843:web:721124e99a10cdc9d04996",
};

function formatPriceEok(priceMan) {
  const eok = Math.floor(priceMan / 10000);
  const remainder = priceMan % 10000;
  if (eok === 0) return `${priceMan.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억${remainder.toLocaleString()}`;
}

async function main() {
  console.log('📡 Firestore에서 실거래가 데이터 읽는 중...');
  
  const app = initializeApp(firebaseConfig, 'sync-tx');
  const db = getFirestore(app);
  
  const collRef = collection(db, 'transactions');
  const q = query(collRef, orderBy('contractDate', 'desc'));
  const snapshot = await getDocs(q);

  console.log(`📋 총 ${snapshot.size}건 로드 완료`);

  // 아파트별 그룹핑
  const byApt = {};

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const aptName = d.aptName || '';
    if (!aptName) return;

    if (!byApt[aptName]) byApt[aptName] = [];
    byApt[aptName].push({
      contractYm: d.contractYm || '',
      contractDay: d.contractDay || '',
      price: d.price || 0,
      priceEok: formatPriceEok(d.price || 0),
      area: d.area || 0,
      areaPyeong: d.areaPyeong || 0,
      floor: d.floor || 0,
      dong: d.dong || '',
    });
  });

  // 아파트별 요약 계산
  const summaries = {};
  let aptCount = 0;

  for (const [aptName, txs] of Object.entries(byApt)) {
    const prices = txs.map(t => t.price).filter(p => p > 0);
    if (prices.length === 0) continue;

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const latestTx = txs[0]; // already sorted by contractDate desc
    
    summaries[aptName] = {
      latestPrice: latestTx.price,
      latestPriceEok: latestTx.priceEok,
      latestArea: latestTx.areaPyeong,
      latestFloor: latestTx.floor,
      latestDate: `${latestTx.contractYm}${latestTx.contractDay}`,
      maxPrice,
      maxPriceEok: formatPriceEok(maxPrice),
      minPrice,
      minPriceEok: formatPriceEok(minPrice),
      txCount: txs.length,
      // 최근 4건 (카드 미리보기용)
      recent: txs.slice(0, 4).map(t => ({
        date: `${t.contractYm.slice(4)}.${t.contractDay}`,
        priceEok: t.priceEok,
        areaPyeong: t.areaPyeong,
        floor: t.floor,
        area: t.area,
      })),
    };
    aptCount++;
  }

  console.log(`\n✅ 요약 완료: ${aptCount}개 아파트`);

  // TypeScript 파일 생성
  let ts = `/**
 * 실거래가 요약 데이터 — 빌드 타임에 포함, API 호출 0
 * 
 * ⚠️ 이 파일은 자동 생성됩니다. 직접 수정하지 마세요!
 * 동기화: npm run sync-transactions
 * 마지막 동기화: ${new Date().toISOString().slice(0, 10)}
 */

export interface RecentTx {
  date: string;
  priceEok: string;
  areaPyeong: number;
  floor: number;
  area: number;
}

export interface AptTxSummary {
  latestPrice: number;
  latestPriceEok: string;
  latestArea: number;
  latestFloor: number;
  latestDate: string;
  maxPrice: number;
  maxPriceEok: string;
  minPrice: number;
  minPriceEok: string;
  txCount: number;
  recent: RecentTx[];
}

/** 아파트명 → 거래 요약 */
export const TX_SUMMARY: Record<string, AptTxSummary> = `;

  ts += JSON.stringify(summaries, null, 2) + ';\n';

  fs.writeFileSync(OUTPUT_PATH, ts, 'utf-8');
  console.log(`📁 파일 생성: ${OUTPUT_PATH}`);
  console.log(`🎉 동기화 완료! git add + commit + push 하세요.`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
