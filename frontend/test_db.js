const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(sa)
});

async function check() {
  const snap = await admin.firestore().collection('fieldReports').where('apartmentName', '==', '힐스테이트 동탄역').get();
  if (snap.empty) {
    console.log("No report found for 힐스테이트 동탄역");
  } else {
    console.log(JSON.stringify(snap.docs[0].data(), null, 2));
  }
}
check().catch(console.error);
