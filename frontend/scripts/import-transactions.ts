/**
 * Google Sheets → Firestore 실거래가 일괄 Import 스크립트
 * 
 * Usage: npx tsx scripts/import-transactions.ts
 * 
 * 기존 Google Sheets CSV에서 6만건을 읽어 Firestore 'transactions' 컬렉션에 배치 저장
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firebase Admin SDK 초기화 (서비스 계정 또는 기본 자격 증명) ---
// 로컬에서는 GOOGLE_APPLICATION_CREDENTIALS 환경변수 또는 아래 직접 설정
const SHEET_ID = '1a56YVgFgMJ1Hmcpe0-ViDQ3Wn2ThxdL6U7fKuMb6xGE';
const SHEET_TAB = '실거래가';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
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

function extractDong(sigungu: string): string {
  const parts = sigungu.split(' ');
  return parts[parts.length - 1] || '';
}

async function main() {
  // Firebase Admin 초기화
  const app = initializeApp();
  const db = getFirestore(app);

  // 1. Google Sheets CSV fetch
  console.log('📥 Fetching Google Sheets CSV...');
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
  
  const csvText = await res.text();
  const lines = csvText.split('\n').filter(l => l.trim());
  console.log(`📊 Total CSV lines: ${lines.length}`);

  // 2. Parse CSV → records
  const records: any[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 15) continue;

    const sigungu = cols[1] || '';
    const priceStr = (cols[9] || '0').replace(/,/g, '');
    const priceNum = parseInt(priceStr, 10) || 0;
    const areaNum = parseFloat(cols[6]) || 0;
    const contractYm = cols[7] || '';
    const contractDay = cols[8] || '';

    records.push({
      no: parseInt(cols[0], 10) || i,
      sigungu,
      dong: extractDong(sigungu),
      aptName: cols[5] || '',
      area: areaNum,
      areaPyeong: Math.round(areaNum / 3.3058 * 10) / 10,
      contractYm,
      contractDay,
      price: priceNum,
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
      // Composite key for dedup
      _key: `${cols[5]}_${contractYm}_${contractDay}_${areaNum}_${priceNum}_${cols[11]}`,
      source: 'sheets_import',
    });
  }

  console.log(`✅ Parsed ${records.length} records`);

  // 3. Batch write to Firestore (500 per batch — Firestore limit)
  const BATCH_SIZE = 500;
  const collRef = db.collection('transactions');
  let written = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = records.slice(i, i + BATCH_SIZE);
    
    for (const record of slice) {
      const docRef = collRef.doc(record._key);
      batch.set(docRef, record, { merge: true });
    }

    await batch.commit();
    written += slice.length;
    console.log(`  📦 Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${written}/${records.length} (${Math.round(written / records.length * 100)}%)`);
  }

  console.log(`\n🎉 Import complete! ${written} records written to Firestore.`);
}

main().catch(console.error);
