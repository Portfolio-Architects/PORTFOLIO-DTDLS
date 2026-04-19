const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/import-csv.js <path_to_csv>');
  process.exit(1);
}

const resolvedPath = path.resolve(csvPath);
console.log('Reading CSV from: ' + resolvedPath);

const pyScript = `
import pandas as pd
import json
import sys

csv_file = sys.argv[1]
try:
    df = pd.read_csv(csv_file, encoding='cp949', skiprows=15)
    df = df.fillna(0)
    
    records = []
    for _, row in df.iterrows():
        ym = str(row.get('계약년월', ''))
        if not ym: continue
            
        deposit_str = str(row.get('보증금(만원)', '0')).replace(',', '')
        rent_str = str(row.get('월세금(만원)', '0')).replace(',', '')
        
        deposit = int(deposit_str) if deposit_str.isdigit() else 0
        rent = int(rent_str) if rent_str.isdigit() else 0
        
        apt_name = str(row.get('단지명', '')).strip()
        dong = str(row.get('시군구', '')).split(' ')[-1]
        if dong == '동탄구': dong = ''
            
        contractDay = str(row.get('계약일', '')).zfill(2)
        
        record = {
            'apartmentName': apt_name,
            'dong': dong,
            'contractYm': ym,
            'contractDay': contractDay,
            'contractDate': ym + contractDay,
            'deposit': deposit,
            'monthlyRent': rent,
            'price': 0,
            'dealType': str(row.get('전월세구분', '')).strip(),
            'area': float(row.get('전용면적(㎡)', 0)),
            'areaPyeong': round(float(row.get('전용면적(㎡)', 0)) / 3.3058, 1),
            'floor': int(row.get('층', 0)) if row.get('층', 0) != 0 else 0,
            'source': 'csv_import'
        }
        records.append(record)
        
    print(json.dumps(records, ensure_ascii=False))
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

const pyPath = path.join(__dirname, 'temp_parser.py');
fs.writeFileSync(pyPath, pyScript, 'utf8');

let stdout;
try {
  stdout = execSync(`python "${pyPath}" "${resolvedPath}"`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 });
} catch (e) {
  console.error('Python parsing failed:', e.message);
  process.exit(1);
}

fs.unlinkSync(pyPath);

const records = JSON.parse(stdout);
console.log(`Parsed ${records.length} records successfully.`);

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function upload() {
  const collRef = db.collection('transactionSync');
  let batches = [];
  let currentBatch = db.batch();
  let count = 0;

  for (const record of records) {
    const docId = `${record.apartmentName}_${record.contractDate}_${record.area}_${record.floor}_${record.dealType}`.replace(/[\//]/g, '');
    const docRef = collRef.doc(docId);
    currentBatch.set(docRef, record, { merge: true });
    count++;
    
    if (count % 400 === 0) {
      batches.push(currentBatch);
      currentBatch = db.batch();
    }
  }
  if (count % 400 !== 0) {
    batches.push(currentBatch);
  }

  let i = 1;
  for (const batch of batches) {
    await batch.commit();
    console.log(`Batch ${i++} / ${batches.length} committed.`);
  }
  console.log('All done!');
  process.exit(0);
}

upload().catch(console.error);
