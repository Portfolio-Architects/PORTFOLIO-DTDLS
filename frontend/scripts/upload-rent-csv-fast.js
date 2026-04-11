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

  const records = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = parseCSV(line);
    if (cols.length < 10) continue;
    
    const no = cols[0];
    if (!no || isNaN(parseInt(no))) continue;

    const sigungu = cols[1] || '';
    const dong = extractDong(sigungu);
    const aptName = (cols[5] || '').trim();
    const dealType = (cols[6] || '').trim(); 
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
      price: deposit,
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

  console.log(`\n✅ CSV 파싱 완료: ${records.length}건`);

  console.log('\n🔥 Firestore에서 기존 데이터를 모두 불러와 중복 필터링을 준비합니다...');
  const db = admin.firestore();
  
  // Note: Only fetching Jeonse/Wolse if possible, or all.
  // We can just fetch all records to build the cache.
  const snapshot = await db.collection('transactions')
    .where('source', '==', 'csv_rent_import')
    .get();

  const existingDocs = new Map();
  snapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.aptName}_${data.contractDate}_${data.deposit}_${data.floor}_${data.monthlyRent || 0}`;
      existingDocs.set(key, { id: doc.id, data: data, ref: doc.ref });
  });
  console.log(`📊 DB 로드 완료: 기존 전월세 데이터 ${existingDocs.size}건`);

  const newRecords = [];
  const updateRecords = [];
  
  for (const record of records) {
      const key = `${record.aptName}_${record.contractDate}_${record.deposit}_${record.floor}_${record.monthlyRent}`;
      const existing = existingDocs.get(key);
      
      if (!existing) {
          newRecords.push({type: 'new', record});
          existingDocs.set(key, { record }); // Prevent duplicates within CSV
      } else if (existing.data && (existing.data.reqGb !== record.reqGb || existing.data.rnuYn !== record.rnuYn)) {
          // If the DB has the record but the renewal fields are different/missing, we perform an update
          updateRecords.push({ type: 'update', ref: existing.ref, record });
          existingDocs.set(key, { ...existing, data: record }); // update local map
      }
  }

  console.log(`\n총 ${records.length}건 중 신규 추가 대상: ${newRecords.length}건, 업데이트 대상: ${updateRecords.length}건`);

  if (newRecords.length === 0 && updateRecords.length === 0) {
      console.log('업데이트할 내역이 없습니다.');
      process.exit(0);
  }

  // Batch insert/update records (Firestore allows up to 500 per batch)
  console.log('🔥 새 데이터 및 수정된 데이터를 Firestore에 적재합니다...');
  const combined = [...newRecords, ...updateRecords];
  const chunks = [];
  for (let i = 0; i < combined.length; i += 500) {
      chunks.push(combined.slice(i, i + 500));
  }

  for (let i = 0; i < chunks.length; i++) {
      const batch = db.batch();
      chunks[i].forEach(item => {
          if (item.type === 'new') {
            const docRef = db.collection('transactions').doc();
            batch.set(docRef, item.record);
          } else {
            batch.update(item.ref, { reqGb: item.record.reqGb, rnuYn: item.record.rnuYn });
          }
      });
      await batch.commit();
      console.log(` -> 진행률: 배치 ${i + 1}/${chunks.length} 완료 (${Math.min((i + 1) * 500, combined.length)}건)`);
  }

  console.log(`\n🎉 전월세 업로드 완료! (신규 ${newRecords.length}건, 업데이트 ${updateRecords.length}건)`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
