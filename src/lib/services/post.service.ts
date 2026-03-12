/**
 * @module post.service
 * @description Business logic for creating posts (orchestrates profile, upload, persistence).
 * Architecture Layer: Service (orchestration of repositories)
 */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';
import * as PostRepo from '@/lib/repositories/post.repository';
import * as UserRepo from '@/lib/repositories/user.repository';
import { logger } from '@/lib/services/logger';

/**
 * Creates a new community post with optional image upload.
 * Orchestration: 1) Fetch user profile → 2) Upload image → 3) Persist post
 * 
 * @param title - Post title
 * @param category - Category tag (e.g., '교통', '부동산')
 * @param authorUid - Firebase Auth UID
 * @param imageFile - Optional image file to attach
 * @throws Error if any step in the pipeline fails
 */
export async function createPost(
  title: string,
  category: string,
  authorUid: string,
  imageFile?: File
): Promise<void> {
  try {
    // 1. Resolve user profile for display name
    const profile = await UserRepo.getOrCreateProfile(authorUid);

    // 2. Upload image if provided
    let imageUrl: string | null = null;
    if (imageFile) {
      const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
      logger.info('PostService.createPost', 'Image uploaded', { imageUrl });
    }

    // 3. Persist to Firestore (include apartment verification if present)
    await PostRepo.createPost({
      title,
      category,
      authorName: profile.nickname,
      authorUid,
      imageUrl,
      verifiedApartment: profile.verifiedApartment,
      verificationLevel: profile.verificationLevel,
    });

    logger.info('PostService.createPost', 'Post created successfully', { title, category });
  } catch (error) {
    logger.error('PostService.createPost', 'Failed to create post', { title, category, authorUid }, error);
    throw error;
  }
}
