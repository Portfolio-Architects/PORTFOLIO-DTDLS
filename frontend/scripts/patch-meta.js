const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    const metaRef = doc(db, 'settings', 'apartmentMeta');
    const snap = await getDoc(metaRef);
    const data = snap.data();
    console.log("Current Hillstate:", data['힐스테이트 동탄역']);
    
    await updateDoc(metaRef, {
      '힐스테이트 동탄역': {
        ...(data['힐스테이트 동탄역'] || {}),
        dong: '영천동',
        txKey: '힐스테이트동탄역' // The key matching transaction-summary.ts
      }
    });
    console.log("Successfully updated settings/apartmentMeta for Hillstate!");
  } catch (err) {
    console.error("Error updating doc:", err);
  }
}
main();
