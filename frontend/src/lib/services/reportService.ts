import { db, storage } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ScoutingReport } from '@/lib/types/scoutingReport';
import { compressImage } from '@/lib/utils/imageCompression';

/**
 * Uploads an image file to Firebase Storage and returns its download URL.
 */
export async function uploadImage(file: File, folderPath: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const storageRef = ref(storage, `${folderPath}/${uniqueName}`);

  const compressed = await compressImage(file);
  const snapshot = await uploadBytes(storageRef, compressed);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Saves the fully constructed Scouting Report to Firestore.
 */
export async function createScoutingReport(
  reportData: Omit<ScoutingReport, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const docRef = await addDoc(collection(db, 'scoutingReports'), {
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding scouting report document: ", error);
    throw error;
  }
}

/**
 * Updates an existing Scouting Report in Firestore.
 */
export async function updateScoutingReport(
  reportId: string,
  updateData: Partial<Omit<ScoutingReport, 'id' | 'createdAt' | 'updatedAt'>>
) {
  try {
    const docRef = doc(db, 'scoutingReports', reportId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating scouting report document: ", error);
    throw error;
  }
}
