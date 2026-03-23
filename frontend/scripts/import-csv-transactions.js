#!/usr/bin/env node
/**
 * 국토교통부 실거래가 CSV → Firestore 업로드 + transaction-summary.ts 재생성
 * 
 * 사용법: node scripts/import-csv-transactions.js <csv파일경로>
 * 
 * 1. CSV 파일 파싱 (EUC-KR → UTF-8)
 * 2. Firestore 'transactions' 컬렉션에 중복 체크 후 신규 건만 추가
 * 3. sync-transactions.js 와 동일한 로직으로 transaction-summary.ts 재생성
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, getDocs, doc, setDoc, where } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { validateTransactions, printValidationReport, saveValidationReport } = require('./validate-transactions');

const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/transaction-summary.ts');

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

function normalizeAptName(name) {
  return name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
}

/** CSV 파싱 — 쉼표 포함된 따옴표 필드 지원 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('사용법: node scripts/import-csv-transactions.js <CSV파일경로>');
    process.exit(1);
  }

  // 1. CSV 파싱
  console.log(`📂 CSV 파일 읽는 중: ${csvPath}`);
  const buf = fs.readFileSync(csvPath);
  const txt = iconv.decode(buf, 'euc-kr');
  const lines = txt.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 헤더 행 찾기 ("NO" 로 시작하는 줄)
  const headerIdx = lines.findIndex(l => l.startsWith('"NO"'));
  if (headerIdx < 0) {
    console.error('❌ CSV 헤더를 찾을 수 없습니다.');
    process.exit(1);
  }

  const dataLines = lines.slice(headerIdx + 1);
  console.log(`📋 데이터 행: ${dataLines.length}건`);

  const newTxs = [];
  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.length < 12) continue;

    const sigungu = cols[1]; // 경기도 화성시 동탄구 xx동
    const aptName = cols[5];
    const areaStr = cols[6];
    const contractYm = cols[7]; // 202603
    const contractDay = cols[8].padStart(2, '0'); // "20" → "20"
    const priceStr = cols[9]; // "43,500"
    const floor = parseInt(cols[11]) || 0;

    // 거래금액 파싱 (쉼표 제거)
    const price = parseInt(priceStr.replace(/,/g, '')) || 0;
    if (price === 0) continue;

    const area = parseFloat(areaStr) || 0;
    const areaPyeong = Math.round(area / 3.306 * 10) / 10;

    // 동 이름 추출: "경기도 화성시 동탄구 영천동" → "영천동"
    const dongParts = sigungu.split(' ');
    const dong = dongParts[dongParts.length - 1] || '';

    newTxs.push({
      aptName: aptName.trim(),
      contractYm,
      contractDay,
      price,
      area,
      areaPyeong,
      floor,
      dong,
      contractDate: `${contractYm}${contractDay}`,
    });
  }

  console.log(`✅ 파싱 완료: ${newTxs.length}건 신규 거래`);

  // 1.5. 데이터 검증
  console.log('\n🔍 데이터 검증 중...');
  const { valid: validTxs, report: validationReport } = validateTransactions(newTxs);
  printValidationReport(validationReport);
  saveValidationReport(validationReport);

  if (validationReport.errors > 0) {
    console.log(`⚠️ ${validationReport.errors}건 차단됨 — 유효한 ${validTxs.length}건만 업로드합니다.`);
  }

  // 2. Firestore에 업로드 (검증 통과 건만)
  console.log('\n📡 Firestore 연결 중...');
  const app = initializeApp(firebaseConfig, 'import-csv');
  const db = getFirestore(app);

  let uploaded = 0;
  let skipped = 0;

  for (const tx of validTxs) {
    // 고유 ID: 아파트명_계약일_면적_층_가격
    const docId = `${normalizeAptName(tx.aptName)}_${tx.contractDate}_${tx.area}_${tx.floor}_${tx.price}`;
    const docRef = doc(db, 'transactions', docId);

    try {
      await setDoc(docRef, tx, { merge: true });
      uploaded++;
    } catch (err) {
      console.error(`⚠️ 업로드 실패: ${tx.aptName} — ${err.message}`);
      skipped++;
    }
  }

  console.log(`📤 Firestore 업로드: ${uploaded}건 성공, ${skipped}건 스킵`);

  // 3. 전체 데이터 다시 읽어서 transaction-summary.ts 재생성
  console.log('\n🔄 전체 데이터 동기화 중...');
  const collRef = collection(db, 'transactions');
  const q = query(collRef, orderBy('contractDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`📋 총 ${snapshot.size}건 로드 완료`);

  const byApt = {};
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const aptName = d.aptName || '';
    if (!aptName) return;
    const key = normalizeAptName(aptName);
    if (!byApt[key]) byApt[key] = [];
    byApt[key].push({
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

  // 요약 계산
  const summaries = {};
  let aptCount = 0;
  for (const [aptName, txs] of Object.entries(byApt)) {
    const prices = txs.map(t => t.price).filter(p => p > 0);
    if (prices.length === 0) continue;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const latestTx = txs[0];

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

  console.log(`\n📁 파일 생성: ${OUTPUT_PATH}`);
  console.log(`✅ ${aptCount}개 아파트 동기화 완료!`);

  // JSON 청크 생성
  const TX_DATA_DIR = path.resolve(__dirname, '../public/tx-data');
  if (fs.existsSync(TX_DATA_DIR)) fs.rmSync(TX_DATA_DIR, { recursive: true });
  fs.mkdirSync(TX_DATA_DIR, { recursive: true });

  let totalRecords = 0;
  for (const [aptName, txs] of Object.entries(byApt)) {
    const records = txs.map(t => ({
      contractYm: t.contractYm,
      contractDay: t.contractDay,
      price: t.price,
      area: t.area,
      areaPyeong: t.areaPyeong,
      floor: t.floor,
    }));
    fs.writeFileSync(path.join(TX_DATA_DIR, `${aptName}.json`), JSON.stringify(records), 'utf-8');
    totalRecords += records.length;
  }
  fs.writeFileSync(path.join(TX_DATA_DIR, '_index.json'), JSON.stringify(Object.keys(byApt)), 'utf-8');
  console.log(`📁 JSON 청크: ${Object.keys(byApt).length}개 아파트, ${totalRecords}건`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
