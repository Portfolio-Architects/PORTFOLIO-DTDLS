/**
 * @module review.repository
 * @description Data Access Layer for user reviews (동네 리뷰) in Firestore.
 * Architecture Layer: Repository (CRUD only)
 */
import { db, storage } from '@/lib/firebaseConfig';
import {
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit,
  doc, updateDoc, increment, deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logger } from '@/lib/services/logger';
import type { UserReview } from '@/lib/types/review.types';
import { compressImage } from '@/lib/utils/imageCompression';

const COLLECTION = 'user_reviews';

/**
 * Listens to user reviews in real-time, ordered by newest first.
 */
export function listenToReviews(callback: (reviews: UserReview[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(q, (snapshot) => {
    const reviews: UserReview[] = snapshot.docs.map(d => {
      const data = d.data();
      // Extract dong from apartmentName pattern "[동이름] 아파트명"
      const dongMatch = data.apartmentName?.match(/\[(.*?)\]/);
      return {
        id: d.id,
        apartmentName: data.apartmentName || '',
        dong: dongMatch?.[1] || data.dong || '',
        rating: data.rating || 5,
        content: data.content || '',
        photoURL: data.photoURL,
        author: data.author || data.authorName || '익명',
        authorUid: data.authorUid || '',
        verifiedApartment: data.verifiedApartment || '',
        verificationLevel: data.verificationLevel || '',
        likes: data.likes || 0,
        createdAt: data.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR') || '',
      };
    });
    callback(reviews);
  });
}

/**
 * Adds a new user review.
 */
export async function addReview(
  apartmentName: string,
  rating: number,
  content: string,
  authorNickname: string,
  authorUid: string,
  verifiedApartment?: string,
  verificationLevel?: string,
  imageFile?: File,
): Promise<void> {
  let photoURL: string | undefined;

  // Upload image if provided
  if (imageFile) {
    try {
      const compressed = await compressImage(imageFile);
      const storageRef = ref(storage, `user_reviews/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, compressed);
      photoURL = await getDownloadURL(snapshot.ref);
    } catch (e) {
      logger.error('ReviewRepository.addReview', 'Image upload failed', undefined, e);
    }
  }

  await addDoc(collection(db, COLLECTION), {
    apartmentName,
    rating,
    content,
    photoURL: photoURL || null,
    author: authorNickname,
    authorUid,
    verifiedApartment: verifiedApartment || '',
    verificationLevel: verificationLevel || '',
    likes: 0,
    createdAt: serverTimestamp(),
  });

  logger.info('ReviewRepository.addReview', 'User review created', { apartmentName, rating });
}

/**
 * Increments the like count of a review.
 */
export async function incrementReviewLike(reviewId: string): Promise<void> {
  const reviewRef = doc(db, COLLECTION, reviewId);
  await updateDoc(reviewRef, { likes: increment(1) });
}

/**
 * Deletes a user review by ID.
 * @param reviewId - The Firestore document ID
 * @throws FirestoreError if delete fails
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const reviewRef = doc(db, COLLECTION, reviewId);
  await deleteDoc(reviewRef);
  logger.info('ReviewRepository.deleteReview', 'Review deleted', { reviewId });
}
