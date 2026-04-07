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

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/transaction-summary.ts');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

function formatPriceEok(priceMan) {
  const eok = Math.floor(priceMan / 10000);
  const remainder = priceMan % 10000;
  if (eok === 0) return `${priceMan.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억${remainder.toLocaleString()}`;
}

/** page.tsx와 동일한 정규화 — 공백·괄호·[동이름] 제거 */
function normalizeAptName(name) {
  return name
    .replace(/\[.*?\]\s*/g, '')
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .trim();
}

async function main() {
  console.log('📡 Firestore에서 실거래가 데이터 읽는 중...');
  
  const db = admin.firestore();
  
  const collRef = db.collection('transactions');
  const snapshot = await collRef.orderBy('contractDate', 'desc').get();

  console.log(`📋 총 ${snapshot.size}건 로드 완료`);

  // 아파트별 그룹핑 (정규화된 키 사용)
  const byApt = {};

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const aptName = d.aptName || '';
    if (!aptName) return;

    const key = normalizeAptName(aptName);
    if (!byApt[key]) byApt[key] = [];    
    
    const cDate = `${d.contractYm || ''}${String(d.contractDay || '').padStart(2, '0')}`;
    
    // 심화된 중복 방지 (기본 transactions 컬렉션 내에서도 중복 방지)
    const isDup = byApt[key].some(t => 
      t.contractDate === cDate && 
      t.area === (d.area || 0) && 
      Math.abs(t.floor - (d.floor || 0)) < 1 &&
      ((t.price === (d.price || 0) && t.price > 0) || (t.deposit === (d.deposit || 0) && t.deposit > 0))
    );

    if (!isDup) {
      byApt[key].push({
        contractYm: d.contractYm || '',
        contractDay: d.contractDay || '',
        price: d.price || 0,
        priceEok: (d.dealType === '전세' || d.dealType === '월세') 
          ? formatPriceEok(d.deposit || 0) + (d.monthlyRent ? `/${d.monthlyRent}` : '')
          : formatPriceEok(d.price || 0),
        deposit: d.deposit || 0,
        monthlyRent: d.monthlyRent || 0,
        area: d.area || 0,
        areaPyeong: d.areaPyeong || 0,
        floor: d.floor || 0,
        dong: d.dong || '',
        dealType: d.dealType || '매매',
        contractDate: cDate,
      });
    }
  });

  console.log('📡 Firestore transactionSync (임대차 등) 로딩 중...');
  const syncSnap = await db.collection('transactionSync').orderBy('contractYm', 'desc').get();
  console.log(`📋 transactionSync 컬렉션에서 ${syncSnap.size}건 로드 완료`);

  syncSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const aptName = d.apartmentName || d.aptName || '';
    if (!aptName) return;

    const key = normalizeAptName(aptName);
    if (!byApt[key]) byApt[key] = [];    
    
    const cDate = d.contractDate || `${d.contractYm || ''}${String(d.contractDay || '').padStart(2, '0')}`;
    
    // 심화된 중복 방지: 날짜, 면적, 가격(또는 보증금), 층수가 동일하면 완벽히 같은 거래로 간주 (dealType 표기법 차이 무시)
    const isDup = byApt[key].some(t => 
      t.contractDate === cDate && 
      t.area === d.area && 
      Math.abs(t.floor - d.floor) < 1 &&
      ((t.price === d.price && t.price > 0) || (t.deposit === d.deposit && t.deposit > 0))
    );

    if (!isDup) {
      byApt[key].push({
        contractYm: d.contractYm || '',
        contractDay: d.contractDay || '',
        price: d.price || 0,
        priceEok: (d.dealType === '전세' || d.dealType === '월세') 
          ? formatPriceEok(d.deposit || 0) + (d.monthlyRent ? `/${d.monthlyRent}` : '')
          : formatPriceEok(d.price || 0),
        deposit: d.deposit || 0,
        monthlyRent: d.monthlyRent || 0,
        area: d.area || 0,
        areaPyeong: d.areaPyeong || 0,
        floor: d.floor || 0,
        dong: d.dong || '',
        dealType: d.dealType || '매매',
        contractDate: cDate,
      });
    }
  });

  // 아파트별 요약 계산
  const summaries = {};
  let aptCount = 0;

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  for (const [aptName, txs] of Object.entries(byApt)) {
    // 매매와 전월세 분리 ('전세', '월세'가 명시된 것만 임대차 거래로 치고 나머지는 모두 매매로 취급)
    const rentTxs = txs.filter(t => t.dealType === '전세' || t.dealType === '월세');
    const saleTxs = txs.filter(t => t.dealType !== '전세' && t.dealType !== '월세');
    
    // 매매/임대 데이터가 둘 다 없으면 스킵
    if (saleTxs.length === 0 && rentTxs.length === 0) continue;

    // --- 매매 요약 ---
    const prices = saleTxs.map(t => t.price).filter(p => p > 0);
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    
    // contractDate 기준으로 내림차순 정렬
    saleTxs.sort((a, b) => b.contractDate.localeCompare(a.contractDate));
    const latestTx = saleTxs.length > 0 ? saleTxs[0] : null;

    const recentMonthSale = saleTxs.filter(t => {
      if (!t.contractYm || t.contractYm.length < 6) return false;
      const y = parseInt(t.contractYm.slice(0, 4));
      const m = parseInt(t.contractYm.slice(4, 6));
      const d = parseInt(t.contractDay) || 1;
      const txDate = new Date(y, m - 1, d);
      return txDate >= oneMonthAgo && t.price > 0 && t.areaPyeong > 0;
    });

    const avg1MPrice = recentMonthSale.length > 0
      ? Math.round(recentMonthSale.reduce((s, t) => s + t.price, 0) / recentMonthSale.length)
      : (latestTx ? latestTx.price : 0);
    
    const avg1MPerPyeong = recentMonthSale.length > 0
      ? Math.round(recentMonthSale.reduce((s, t) => s + t.price / t.areaPyeong, 0) / recentMonthSale.length)
      : (latestTx && latestTx.areaPyeong > 0 ? Math.round(latestTx.price / latestTx.areaPyeong) : 0);

    // --- 전월세 요약 ---
    rentTxs.sort((a, b) => b.contractDate.localeCompare(a.contractDate));
    const latestRentTx = rentTxs.filter(t => t.deposit > 0)[0];
    
    const recentMonthRent = rentTxs.filter(t => {
      if (!t.contractYm || t.contractYm.length < 6) return false;
      const y = parseInt(t.contractYm.slice(0, 4));
      const m = parseInt(t.contractYm.slice(4, 6));
      const d = parseInt(t.contractDay) || 1;
      const txDate = new Date(y, m - 1, d);
      return txDate >= oneMonthAgo && t.deposit > 0; // 전세 위주
    });

    const avg1MDeposit = recentMonthRent.length > 0
      ? Math.round(recentMonthRent.reduce((s, t) => s + t.deposit, 0) / recentMonthRent.length)
      : (latestRentTx ? latestRentTx.deposit : 0);

    summaries[aptName] = {
      // 매매 데이터
      latestPrice: latestTx ? latestTx.price : 0,
      latestPriceEok: latestTx ? latestTx.priceEok : "0",
      latestArea: latestTx ? latestTx.areaPyeong : 0,
      latestFloor: latestTx ? latestTx.floor : 0,
      latestDate: latestTx ? `${latestTx.contractYm}${latestTx.contractDay}` : "",
      maxPrice,
      maxPriceEok: maxPrice > 0 ? formatPriceEok(maxPrice) : "0",
      minPrice,
      minPriceEok: minPrice > 0 ? formatPriceEok(minPrice) : "0",
      txCount: saleTxs.length,
      avg1MPrice,
      avg1MPriceEok: formatPriceEok(avg1MPrice),
      avg1MPerPyeong,
      avg1MTxCount: recentMonthSale.length,
      recent: saleTxs.slice(0, 4).map(t => ({
        date: `${t.contractYm.slice(4)}.${t.contractDay}`,
        priceEok: t.priceEok,
        areaPyeong: t.areaPyeong,
        floor: t.floor,
        area: t.area,
      })),
      
      // 전월세 데이터
      rentTxCount: rentTxs.length,
      latestRentDeposit: latestRentTx ? latestRentTx.deposit : 0,
      latestRentDepositEok: latestRentTx ? formatPriceEok(latestRentTx.deposit) : "0",
      latestRentMonthly: latestRentTx ? latestRentTx.monthlyRent : 0,
      latestRentDate: latestRentTx ? `${latestRentTx.contractYm}${latestRentTx.contractDay}` : "",
      avg1MRentDeposit: avg1MDeposit,
      avg1MRentDepositEok: formatPriceEok(avg1MDeposit),
    };
    aptCount++;
  }

  console.log(`\n✅ 요약 완료: ${aptCount}개 아파트 (매매+전월세 통합)`);

  // TypeScript 파일 생성
  let ts = `/**
 * 실거래가 및 전월세 요약 데이터 — 빌드 타임에 포함, API 호출 0
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
  // 매매 (Sale)
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
  avg1MPrice: number;
  avg1MPriceEok: string;
  avg1MPerPyeong: number;
  avg1MTxCount: number;
  recent: RecentTx[];
  
  // 전월세 (Rent/Jeonse)
  rentTxCount?: number;
  latestRentDeposit?: number;
  latestRentDepositEok?: string;
  latestRentMonthly?: number;
  latestRentDate?: string;
  avg1MRentDeposit?: number;
  avg1MRentDepositEok?: string;
}

/** 아파트명 → 거래 요약 */
export const TX_SUMMARY: Record<string, AptTxSummary> = `;

  ts += JSON.stringify(summaries, null, 2) + ';\n';

  fs.writeFileSync(OUTPUT_PATH, ts, 'utf-8');
  console.log(`📁 파일 생성: ${OUTPUT_PATH}`);
  console.log(`🎉 동기화 완료!`);
  

  // ── 아파트별 JSON 청크 생성 (public/tx-data/*.json) ──
  // 기존 16MB 단일 .ts 파일 대신 아파트별 개별 JSON 파일로 분할
  // → 모달에서 해당 아파트만 fetch('/tx-data/{aptKey}.json')로 로딩 (~100KB)
  const TX_DATA_DIR = path.resolve(__dirname, '../public/tx-data');
  
  // 디렉토리 초기화
  if (fs.existsSync(TX_DATA_DIR)) {
    fs.rmSync(TX_DATA_DIR, { recursive: true });
  }
  fs.mkdirSync(TX_DATA_DIR, { recursive: true });

  let totalRecords = 0;
  let totalSizeKB = 0;
  let chunkCount = 0;

  for (const [aptName, txs] of Object.entries(byApt)) {
    const records = txs.map(t => ({
      contractYm: t.contractYm,
      contractDay: t.contractDay,
      price: t.price,
      priceEok: (t.dealType === '전세' || t.dealType === '월세') 
        ? formatPriceEok(t.deposit || 0) + (t.monthlyRent ? ` / ${t.monthlyRent}만` : '')
        : formatPriceEok(t.price || 0),
      deposit: t.deposit || 0,
      monthlyRent: t.monthlyRent || 0,
      area: t.area,
      areaPyeong: t.areaPyeong,
      floor: t.floor,
      dealType: t.dealType || '',
    }));

    // 파일명: 정규화된 아파트명 (URL-safe)
    const filename = `${aptName}.json`;
    const filepath = path.join(TX_DATA_DIR, filename);
    const json = JSON.stringify(records);
    
    fs.writeFileSync(filepath, json, 'utf-8');
    
    totalRecords += records.length;
    totalSizeKB += json.length / 1024;
    chunkCount++;
  }

  // 인덱스 파일 생성 (어떤 아파트들이 있는지 목록)
  const index = Object.keys(byApt);
  fs.writeFileSync(
    path.join(TX_DATA_DIR, '_index.json'),
    JSON.stringify(index),
    'utf-8'
  );

  console.log(`📁 JSON 청크: ${TX_DATA_DIR}`);
  console.log(`   ${chunkCount}개 아파트, ${totalRecords}건, 총 ${Math.round(totalSizeKB)}KB`);
  console.log(`   (기존 16MB .ts → ${Math.round(totalSizeKB)}KB 분할)`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
