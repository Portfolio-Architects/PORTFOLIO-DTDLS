/**
 * @module user.repository
 * @description Data Access Layer for user profiles in Firestore.
 * Architecture Layer: Repository (CRUD only)
 */
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/lib/services/logger';
import type { UserProfile } from '@/lib/types/user.types';
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
