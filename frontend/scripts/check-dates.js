const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../serviceAccountKey.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log("Querying Firestore database...");
  const snap1 = await db.collection('transactions').where('dealType', '==', '전세').get();
  const snap2 = await db.collection('transactions').where('dealType', '==', '월세').get();
  
  const docs = [...snap1.docs, ...snap2.docs].map(d => d.data());
  docs.sort((a, b) => a.contractDate.localeCompare(b.contractDate));
  
  if (docs.length === 0) {
    console.log("No rent data found.");
  } else {
    const first = docs[0];
    const last = docs[docs.length - 1];
    console.log(`Earliest Date: ${first.contractDate} (${first.aptName})`);
    console.log(`Latest Date:   ${last.contractDate} (${last.aptName})`);
    console.log(`Total count:   ${docs.length}`);
  }
  process.exit(0);
}
main();
