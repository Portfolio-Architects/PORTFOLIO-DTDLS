const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function getOldest() {
  const snap = await db.collection('transactions')
    .where('source', '==', 'csv_rent_import')
    .get();

  if (!snap.empty) {
    let oldest = snap.docs[0].data();
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.contractDate < oldest.contractDate) oldest = d;
    }
    console.log(`Oldest Date: ${oldest.contractDate} | Name: ${oldest.aptName} | Type: ${oldest.dealType}`);
  } else {
    console.log('No rent data found yet.');
  }
}
getOldest().catch(console.error);
