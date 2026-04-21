const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const tSnap = await db.collection('transactions').where('contractYm', '>=', '201901').where('contractYm', '<=', '201912').limit(10).get();
  tSnap.forEach(doc => {
      const d = doc.data();
      console.log(`transactions: ${d.contractYm}${d.contractDay} | ${d.aptName} | type: ${d.dealType} | price: ${d.price} | deposit: ${d.deposit}`);
  });
  
  process.exit(0);
}

check().catch(console.error);
