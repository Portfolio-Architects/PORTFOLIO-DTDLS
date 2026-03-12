/**
 * @module user.repository
 * @description Data Access Layer for user profiles in Firestore.
 * Architecture Layer: Repository (CRUD only)
 */
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/lib/services/logger';
import type { UserProfile, VerificationLevel } from '@/lib/types/user.types';
import { generateRandomNickname } from '@/lib/services/nickname.service';

/**
 * Gets or creates a user profile. On first login, a random nickname is generated.
 * @param uid - Firebase Auth UID
 * @returns The user's profile
 */
export async function getOrCreateProfile(uid: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // First login — generate a profile
  const newProfile: UserProfile = {
    nickname: generateRandomNickname(),
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, newProfile);
  logger.info('UserRepository.getOrCreateProfile', 'New user profile created', { uid, nickname: newProfile.nickname });
  return { nickname: newProfile.nickname };
}

/**
 * Sets the user's apartment verification.
 * @param uid - Firebase Auth UID
 * @param apartment - Apartment name (e.g., '[오산동] 동탄역 롯데캐슬')
 * @param level - Verification level ('self_declared' or 'registry_verified')
 */
export async function setApartmentVerification(
  uid: string,
  apartment: string,
  level: VerificationLevel
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    verifiedApartment: apartment,
    verificationLevel: level,
  });
  logger.info('UserRepository.setApartmentVerification', 'Apartment verified', { uid, apartment, level });
}
