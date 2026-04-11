/**
 * 전월세 CSV → Firestore 업로더
 * 국토교통부 실거래가 CSV (전월세)를 읽어서 Firestore 'transactions' 컬렉션에 저장
 * 
 * 사용법: node scripts/upload-rent-csv.js <csv파일경로>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

function parseCSV(line) {
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

function extractDong(sigungu) {
  const parts = sigungu.split(/\s+/);
  return parts[parts.length - 1] || '';
}

async function main() {
  let csvPath = process.argv[2];
  if (!csvPath) {
    const desktop = path.join(process.env.USERPROFILE || process.env.HOME || '', 'OneDrive', '바탕 화면');
    const files = fs.readdirSync(desktop).filter(f => f.includes('전월세') && f.endsWith('.csv'));
    if (files.length === 0) {
      console.error('❌ 바탕화면에서 전월세 실거래가 CSV를 찾을 수 없습니다');
      process.exit(1);
    }
    csvPath = path.join(desktop, files[files.length - 1]);
  }

  console.log(`📂 CSV 파일 읽는 중: ${csvPath}`);
  
  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, 'euc-kr');
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));

  console.log(`📋 총 ${lines.length}줄`);

  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const parsed = parseCSV(lines[i]);
    if (parsed[0] === 'NO' || parsed[0] === '"NO"') {
      headerIdx = i;
      break;
    }
  }
  
  if (headerIdx === -1) {
    console.error('❌ 헤더를 찾을 수 없습니다');
    process.exit(1);
  }

  const header = parseCSV(lines[headerIdx]);
  console.log(`📊 헤더 (${headerIdx}번째 줄): ${header.join(' | ')}`);

  const records = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = parseCSV(line);
    if (cols.length < 10) continue;
    
    const no = cols[0];
    if (!no || isNaN(parseInt(no))) continue;

    /*
      Rent CSV Columns:
      [0] NO, [1] 시군구, [2] 단지명, [3] 전월세구분, [4] 전용면적(㎡), 
      [5] 계약년월, [6] 계약일, [7] 보증금(만원), [8] 월세(만원), [9] 층, [10] 건축년도
    */
    const sigungu = cols[1] || '';
    const dong = extractDong(sigungu);
    const aptName = (cols[5] || '').trim();
    const dealType = (cols[6] || '').trim(); // '전세' or '월세'
    const area = parseFloat(cols[7]) || 0;
    const contractYm = (cols[8] || '').trim();
    const contractDay = (cols[9] || '').trim();
    const depositStr = (cols[10] || '').replace(/,/g, '').trim();
    const monthlyRentStr = (cols[11] || '').replace(/,/g, '').trim();
    
    const reqGb = (cols[16] || '').trim(); // Q열: 계약구분 (신규/갱신)
    const rnuYn = (cols[17] || '').trim(); // R열: 갱신요구권 사용여부 (사용/미사용)
    
    const deposit = parseInt(depositStr) || 0;
    const monthlyRent = parseInt(monthlyRentStr) || 0;
    const floor = parseInt(cols[12]) || 0;
    const buildYear = parseInt(cols[13]) || 0;
    
    if (!aptName || !contractYm) continue;

    const areaPyeong = Math.round(area / 3.3058 * 10) / 10;

    records.push({
      dong,
      aptName,
      area,
      areaPyeong,
      contractYm,
      contractDay,
      price: deposit, // UI 매매가 호환성용 (보증금 기준)
      deposit: deposit,
      monthlyRent: monthlyRent,
      reqGb,
      rnuYn,
      floor,
      buildYear,
      dealType,
      contractDate: `${contractYm}${contractDay.padStart(2, '0')}`,
      source: 'csv_rent_import',
    });
  }

  console.log(`\n✅ 파싱 완료: ${records.length}건`);
  
  console.log('\n📋 미리보기 (처음 5건):');
  records.slice(0, 5).forEach((r, i) => {
    const eok = Math.floor(r.deposit / 10000);
    const rem = r.deposit % 10000;
    const depStr = eok > 0 ? (rem > 0 ? `${eok}억${rem.toLocaleString()}` : `${eok}억`) : `${r.deposit.toLocaleString()}만`;
    console.log(`  ${i+1}. ${r.aptName} | ${r.contractYm}.${r.contractDay} | ${r.dealType} ${depStr}${r.monthlyRent > 0 ? '/' + r.monthlyRent : ''} | ${r.areaPyeong}평 | ${r.floor}층 | ${r.dong}`);
  });

  console.log('\n🔥 Firestore에 업로드 중...');
  const db = admin.firestore();
  const collRef = db.collection('transactions');

  let uploaded = 0;
  let skipped = 0;

  for (const record of records) {
    const dupSnap = await collRef
      .where('aptName', '==', record.aptName)
      .where('contractDate', '==', record.contractDate)
      .where('deposit', '==', record.deposit)
      .where('floor', '==', record.floor)
      .get();
    
    if (!dupSnap.empty) {
      skipped++;
      continue;
    }
    
    // UUID (auto) 대신 고유 _key를 생성하여 지정할지 결정. 여기서는 매매 CSV 형식에 맞추어 addDoc 사용
    await collRef.add(record);
    uploaded++;
  }

  console.log(`\n🎉 전월세 업로드 완료!`);
  console.log(`  ✅ 신규 추가: ${uploaded}건`);
  console.log(`  ⏭️ 중복 스킵: ${skipped}건`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
