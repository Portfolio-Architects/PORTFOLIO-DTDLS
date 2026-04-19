import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, limit, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', '힐스테이트 동탄역'), limit(1));
    const querySnapshot = await getDocs(q);
    console.log('empty?', querySnapshot.empty);
    if (!querySnapshot.empty) {
      console.log('data:', querySnapshot.docs[0].data());
    }
  } catch(e) {
    console.error('error:', e);
  }
}
test();
