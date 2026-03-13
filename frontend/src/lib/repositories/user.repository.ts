/**
 * @module user.repository
 * @description Data Access Layer for user profiles in Firestore.
 * Architecture Layer: Repository (CRUD only)
 */
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { logger } from '@/lib/services/logger';
import type { UserProfile, VerificationLevel } from '@/lib/types/user.types';
import { generateRandomNickname, DEFAULT_FRONT_NAME } from '@/lib/services/nickname.service';

/**
 * Gets or creates a user profile. On first login, a random nickname is generated.
 * @param uid - Firebase Auth UID
 * @returns The user's profile
 */
export async function getOrCreateProfile(uid: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      frontName: data.frontName || DEFAULT_FRONT_NAME,
      nickname: data.nickname,
      photoURL: data.photoURL,
      verifiedApartment: data.verifiedApartment,
      verificationLevel: data.verificationLevel,
      reviewCount: data.reviewCount || 0,
      createdAt: data.createdAt,
    };
  }

  // First login — generate a profile
  const newProfile: UserProfile = {
    frontName: DEFAULT_FRONT_NAME,
    nickname: generateRandomNickname(),
    reviewCount: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, newProfile);
  logger.info('UserRepository.getOrCreateProfile', 'New user profile created', { uid, nickname: newProfile.nickname });
  return { frontName: newProfile.frontName, nickname: newProfile.nickname, reviewCount: 0 };
}

/**
 * Increments the user's review count atomically.
 */
export async function incrementReviewCount(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { reviewCount: increment(1) });
  logger.info('UserRepository.incrementReviewCount', 'Review count incremented', { uid });
}

/**
 * Sets the user's apartment verification.
 */
export async function setApartmentVerification(
  uid: string,
  apartment: string,
  level: VerificationLevel
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { verifiedApartment: apartment, verificationLevel: level });
  logger.info('UserRepository.setApartmentVerification', 'Apartment verified', { uid, apartment, level });
}

/**
 * Updates the user's last name (nickname, 3 chars).
 */
export async function updateNickname(uid: string, nickname: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { nickname });
  logger.info('UserRepository.updateNickname', 'Nickname updated', { uid, nickname });
}

/**
 * Updates the user's front name (4 chars).
 */
export async function updateFrontName(uid: string, frontName: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { frontName });
  logger.info('UserRepository.updateFrontName', 'Front name updated', { uid, frontName });
}

/**
 * Updates the user's profile photo URL.
 */
export async function updatePhotoURL(uid: string, photoURL: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { photoURL });
  logger.info('UserRepository.updatePhotoURL', 'Photo URL updated', { uid });
}

