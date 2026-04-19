
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function upload() {
  const dataPath = path.resolve(__dirname, '../../temp_2020_rent.json');
  const records = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('Uploading ' + records.length + ' records...');
  
  const batches = [];
  let currentBatch = db.batch();
  let count = 0;
  
  const collRef = db.collection('transactionSync');
  
  for (const record of records) {
    // Generate a unique ID
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
  
  console.log('Upload complete!');
  process.exit(0);
}

upload().catch(console.error);
