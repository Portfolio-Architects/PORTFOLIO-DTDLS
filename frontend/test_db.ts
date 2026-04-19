import { adminDb } from './src/lib/firebaseAdmin';

async function check() {
  const snap = await adminDb.collection('fieldReports').where('apartmentName', '==', '힐스테이트 동탄역').get();
  if (snap.empty) {
    console.log("No report found for 힐스테이트 동탄역");
  } else {
    console.log(JSON.stringify(snap.docs[0].data(), null, 2));
  }
}

check().catch(console.error);
