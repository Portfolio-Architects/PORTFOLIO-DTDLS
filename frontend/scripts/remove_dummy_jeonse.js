require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
};

const app = initializeApp(firebaseConfig, 'dummy-remove');
const db = getFirestore(app);

async function removeDummy() {
  const dummyTxs = [
    { contractYm: '202603', contractDay: '15', dealType: '전세' },
    { contractYm: '202602', contractDay: '10', dealType: '전세' },
    { contractYm: '202601', contractDay: '20', dealType: '월세' },
    { contractYm: '202512', contractDay: '05', dealType: '전세' },
    { contractYm: '202511', contractDay: '28', dealType: '월세' }
  ];

  for (const tx of dummyTxs) {
    const key = `DUMMY_힐스테이트동탄역_${tx.contractYm}_${tx.contractDay}_${tx.dealType}`;
    try {
      await deleteDoc(doc(db, 'transactions', key));
      console.log("Mock deleted:", key);
    } catch (e) {
      console.log("Error deleting:", key, e.message);
    }
  }
  
  console.log("All dummy transactions removed. Please run sync-transactions.js to rebuild local JSON sources over Firestore.");
  process.exit(0);
}

removeDummy();
