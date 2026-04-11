const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountKey = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../serviceAccountKey.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccountKey) });

async function check() {
  const db = admin.firestore();
  const snap = await db.collection('transactions').where('source', '==', 'csv_rent_import').limit(5).get();
  snap.docs.forEach(doc => {
    const d = doc.data();
    console.log(d.aptName, d.contractYm, d.reqGb, d.rnuYn);
  });
  process.exit(0);
}
check();
