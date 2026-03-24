#!/usr/bin/env node
/**
 * CSV 실거래가 파일 → Firestore 임포트
 * 국토부 실거래가 시스템에서 다운받은 EUC-KR CSV를 파싱하여 Firestore에 저장
 * 
 * Usage: node scripts/import-csv.js scripts/latest-tx.csv
 */

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
  messagingSenderId: "294879479843",
  appId: "1:294879479843:web:721124e99a10cdc9d04996",
};

const csvPath = process.argv[2] || path.resolve(__dirname, 'latest-tx.csv');

async function main() {
  console.log('📂 CSV 파일 읽는 중:', csvPath);

  const buf = fs.readFileSync(csvPath);
  // Try EUC-KR first, fallback to UTF-8
  let text = iconv.decode(buf, 'euc-kr');
  if (!text.includes('시군구') && !text.includes('아파트')) {
    text = buf.toString('utf-8');
  }

  const lines = text.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(l => l);

  // Find the header line (contains 시군구, 번지, 아파트 etc.)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    if (lines[i].includes('시군구') && (lines[i].includes('아파트') || lines[i].includes('단지명'))) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    console.error('❌ CSV 헤더를 찾을 수 없습니다.');
    console.log('처음 10줄:', lines.slice(0, 10));
    process.exit(1);
  }

  // Parse header — handle quoted CSV
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[headerIdx]);
  console.log('📋 헤더:', headers.join(' | '));

  // Map header names to indices
  const idx = (name) => headers.findIndex(h => h.includes(name));
  const iSigungu = idx('시군구');
  const iBunji = idx('번지');
  const iAptName = headers.findIndex(h => h.includes('아파트') || h.includes('단지명'));
  const iArea = idx('전용면적');
  const iFloor = idx('층');
  const iPrice = idx('거래금액');
  const iBuiltYear = idx('건축년도');
  const iContractYm = idx('계약년월');
  const iContractDay = idx('계약일');
  const iDealType = idx('거래유형');
  const iRoadName = idx('도로명');

  console.log(`   시군구=${iSigungu} 아파트=${iAptName} 면적=${iArea} 층=${iFloor} 금액=${iPrice} 계약년월=${iContractYm} 일=${iContractDay}`);

  const records = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;

    const aptName = cols[iAptName] || '';
    if (!aptName) continue;

    const priceStr = (cols[iPrice] || '').replace(/,/g, '').replace(/"/g, '').trim();
    const price = parseInt(priceStr, 10) || 0;
    if (price === 0) continue;

    const area = parseFloat(cols[iArea]) || 0;
    const floor = parseInt(cols[iFloor], 10) || 0;
    const contractYm = (cols[iContractYm] || '').replace(/[^0-9]/g, '');
    const contractDay = (cols[iContractDay] || '').replace(/[^0-9]/g, '').padStart(2, '0');
    const sigungu = cols[iSigungu] || '';

    // Extract dong from sigungu (e.g., "경기도 화성시 동탄구 영천동" → "영천동")
    const parts = sigungu.split(/\s+/);
    const dong = parts[parts.length - 1] || '';

    records.push({
      sigungu,
      dong,
      aptName,
      area,
      areaPyeong: Math.round(area / 3.3058 * 10) / 10,
      contractYm,
      contractDay,
      contractDate: `${contractYm}${contractDay}`,
      price,
      floor,
      buyer: '',
      seller: '',
      buildYear: parseInt(cols[iBuiltYear], 10) || 0,
      roadName: cols[iRoadName] || '',
      cancelDate: '',
      dealType: cols[iDealType] || '',
      agentLocation: '',
      registrationDate: '',
      housingType: '',
      source: 'csv_import',
      _key: `${aptName}_${contractYm}_${contractDay}_${area}_${price}_${floor}`,
    });
  }

  console.log(`\n✅ ${records.length}건 파싱 완료`);
  if (records.length === 0) { process.exit(0); }

  // Show sample
  console.log('\n📋 샘플 데이터:');
  records.slice(0, 3).forEach(r => {
    console.log(`   ${r.aptName} | ${r.contractYm}.${r.contractDay} | ${r.price}만 | ${r.area}㎡ | ${r.floor}층`);
  });

  // Write to Firestore
  console.log('\n📡 Firestore에 저장 중...');
  const app = initializeApp(firebaseConfig, 'csv-import');
  const db = getFirestore(app);
  const collRef = collection(db, 'transactions');

  const BATCH_SIZE = 500;
  let written = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const slice = records.slice(i, i + BATCH_SIZE);
    for (const r of slice) {
      batch.set(doc(collRef, r._key), r, { merge: true });
    }
    await batch.commit();
    written += slice.length;
    console.log(`   ${written}/${records.length}건 저장...`);
  }

  console.log(`\n🎉 ${written}건 Firestore 저장 완료!`);
  console.log('   다음 단계: node scripts/sync-transactions.js 실행하여 정적 파일 갱신');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 임포트 실패:', err.message);
  process.exit(1);
});
