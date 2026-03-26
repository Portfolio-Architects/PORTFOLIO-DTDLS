const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snap = await getDocs(collection(db, 'transactions'));
  const names = new Set();
  snap.forEach(doc => {
    const data = doc.data();
    if (data.aptName && data.aptName.includes('힐스테이트')) {
      names.add(data.aptName);
    }
  });
  console.log("Found aptNames in DB containing '힐스테이트':", Array.from(names));
}
main();
