const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/);
if (match) {
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(match[1]);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();
  db.collection('scoutingReports').where('apartmentName', '==', '힐스테이트 동탄역').get().then(snap => {
    snap.forEach(doc => {
      console.log('DOC:', doc.id);
      console.log(JSON.stringify(doc.data().metrics, null, 2));
    });
    process.exit(0);
  });
}
