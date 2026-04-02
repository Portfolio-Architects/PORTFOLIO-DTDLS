require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
};

const app = initializeApp(firebaseConfig, 'dummy-inject');
const db = getFirestore(app);
const collRef = collection(db, 'transactions');

async function inject() {
  const dummyTxs = [
    { deposit: 40000, monthlyRent: 0, contractYm: '202603', contractDay: '15', area: 54.5508, floor: 15, dealType: '전세' },
    { deposit: 38000, monthlyRent: 0, contractYm: '202602', contractDay: '10', area: 54.5533, floor: 5, dealType: '전세' },
    { deposit: 10000, monthlyRent: 150, contractYm: '202601', contractDay: '20', area: 54.4202, floor: 20, dealType: '월세' },
    { deposit: 42000, monthlyRent: 0, contractYm: '202512', contractDay: '05', area: 54.5508, floor: 25, dealType: '전세' },
    { deposit: 35000, monthlyRent: 50, contractYm: '202511', contractDay: '28', area: 54.9749, floor: 10, dealType: '월세' }
  ];

  for (const tx of dummyTxs) {
    const key = `DUMMY_힐스테이트동탄역_${tx.contractYm}_${tx.contractDay}_${tx.dealType}`;
    await setDoc(doc(collRef, key), {
      sigungu: "경기도 화성시 동탄구 오산동",
      dong: "오산동",
      aptName: "힐스테이트동탄역",
      area: tx.area,
      areaPyeong: Math.round(tx.area / 3.3058 * 10) / 10,
      contractYm: tx.contractYm,
      contractDay: tx.contractDay,
      contractDate: `${tx.contractYm}${tx.contractDay}`,
      price: tx.deposit, // Base UI price
      priceEok: (tx.deposit / 10000).toFixed(1) + '억', // Required for UI tabular data
      deposit: tx.deposit,
      monthlyRent: tx.monthlyRent,
      floor: tx.floor,
      buildYear: 2021,
      dealType: tx.dealType,
      source: "dummy",
      _key: key
    }, { merge: true });
    console.log("Mock inserted:", key);
  }
  process.exit(0);
}
inject();
