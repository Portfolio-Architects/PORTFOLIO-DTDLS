const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'portfolio-dtdls',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY).replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function main() {
  const db = admin.firestore();
  console.log('Querying transactions...');
  const snap = await db.collection('transactions').select('aptName').get();
  const names = new Set();
  snap.forEach(doc => {
    const d = doc.data();
    if (d.aptName && d.aptName.includes('우남')) {
      names.add(d.aptName);
    }
  });
  console.log('transactions:', Array.from(names));

  console.log('Querying transactionSync...');
  const syncSnap = await db.collection('transactionSync').select('aptName', 'apartmentName').get();
  const syncNames = new Set();
  syncSnap.forEach(doc => {
    const d = doc.data();
    const name = d.apartmentName || d.aptName || '';
    if (name.includes('우남')) {
      syncNames.add(name);
    }
  });
  console.log('transactionSync:', Array.from(syncNames));
  
  process.exit(0);
}
main();
