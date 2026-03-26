const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
});
const db = getFirestore(app);

async function main() {
  const snap = await getDocs(collection(db, 'transactions'));
  const types = new Set();
  let count = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (data.aptName === '힐스테이트동탄역') {
      types.add(data.dealType);
      count++;
    }
  });
  console.log(`Found ${count} txs for 힐스테이트동탄역`);
  console.log("dealTypes:", Array.from(types));
  process.exit(0);
}
main();
