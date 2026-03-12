/**
 * @module post.repository
 * @description Data Access Layer for 'posts' Firestore collection.
 * Architecture Layer: Repository (CRUD only, no business logic)
 * 
 * Rationale: Isolates Firestore-specific operations so the Service layer
 * remains database-agnostic. Enables future migration to another DB.
 */
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/lib/services/logger';
import type { NewsItemData } from '@/lib/types/dashboard.types';
import { Train, Building, BookOpen, Calendar, MessageSquare } from 'lucide-react';

/**
 * Listens to the 'posts' collection in real-time.
 * @param callback - Invoked with the latest posts array on each change
 * @returns Unsubscribe function
 */
export function listenToPosts(callback: (posts: NewsItemData[]) => void): () => void {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));

  return onSnapshot(q, (snapshot) => {
    const posts: NewsItemData[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      let icon = MessageSquare;
      let tagClass = 'tag-culture';

      if (data.category === '교통') { icon = Train; tagClass = 'tag-traffic'; }
      else if (data.category === '부동산') { icon = Building; tagClass = 'tag-realestate'; }
      else if (data.category === '교육') { icon = BookOpen; tagClass = 'tag-edu'; }

      const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString() : '방금 전';

      posts.push({
        id: docSnap.id,
        title: data.title,
        meta: `${dateStr} · ${data.category}`,
        author: data.authorName || '익명',
        imageUrl: data.imageUrl,
        tagClass,
        icon,
        likes: data.likes || 0,
      });
    });

    callback(posts);
  });
}

/**
 * Creates a new post document in Firestore.
 * @param data - Post data to persist
 * @returns The new document ID
 * @throws FirestoreError if write fails
 */
export async function createPost(data: {
  title: string;
  category: string;
  authorName: string;
  authorUid: string;
  imageUrl: string | null;
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'posts'), {
    ...data,
    likes: 0,
    createdAt: serverTimestamp(),
  });
  logger.info('PostRepository.createPost', 'Post created', { id: docRef.id });
  return docRef.id;
}

/**
 * Increments the like counter on a post.
 * @param postId - The Firestore document ID
 * @throws FirestoreError if update fails
 */
export async function incrementPostLike(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { likes: increment(1) });
}
