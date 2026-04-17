/**
 * POST /api/favorite
 * Body: { aptName: string, userId: string }
 * 
 * Toggle favorite status for an apartment.
 * Creates/deletes a favorites doc and increments/decrements favoriteCount on the apartment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuthHeader } from '@/lib/authUtils';
import { redis } from '@/lib/redis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 보안: NoSQL Injection 및 오버플로우 공격 방어용 인바운드 스키마 검증
const favSchema = z.object({
  aptName: z.string().min(1).max(100).trim(), // 아파트 이름 길이 제한 및 스크러빙
});

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    // Auth Validation
    let decodedToken;
    try {
      decodedToken = await verifyAuthHeader(request);
    } catch (authErr) {
      return NextResponse.json({ error: 'Unauthorized Request' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const rawBody = await request.json();
    const parsed = favSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad Request: Invalid Payload', details: parsed.error.issues }, { status: 400 });
    }
    const { aptName } = parsed.data;

    const docId = `${userId}_${aptName}`;
    const favRef = adminDb.collection('favorites').doc(docId);
    const favSnap = await favRef.get();

    if (favSnap.exists) {
      // Remove favorite
      await favRef.delete();
      // Decrement count
      const countRef = adminDb.collection('favoriteCounts').doc(aptName);
      await countRef.set({ count: FieldValue.increment(-1), aptName }, { merge: true });
      if (redis) {
        await redis.hincrby('DTDLS:cache:favoriteCounts', aptName, -1).catch(err => console.warn('Redis HINCRBY error:', err));
      }
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await favRef.set({ userId, aptName, createdAt: FieldValue.serverTimestamp() });
      // Increment count
      const countRef = adminDb.collection('favoriteCounts').doc(aptName);
      await countRef.set({ count: FieldValue.increment(1), aptName }, { merge: true });
      if (redis) {
        await redis.hincrby('DTDLS:cache:favoriteCounts', aptName, 1).catch(err => console.warn('Redis HINCRBY error:', err));
      }
      return NextResponse.json({ favorited: true });
    }
  } catch (error: unknown) {
    console.error('[favorite] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

/**
 * GET /api/favorite?userId=xxx
 * Returns all apartments the user has favorited.
 */
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ favorites: [], warning: 'DB not initialized' }, { status: 200 });

    // Auth Validation
    let decodedToken;
    try {
      decodedToken = await verifyAuthHeader(request);
    } catch (authErr) {
      return NextResponse.json({ favorites: [], warning: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ favorites: [], warning: 'Forbidden' }, { status: 403 });
    }

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), ms))
      ]);

    const snap = await withTimeout(adminDb.collection('favorites').where('userId', '==', userId).get(), 5000);
    const favorites = snap.docs.map(d => d.data().aptName as string);
    return NextResponse.json({ favorites });
  } catch (error: unknown) {
    console.error('[favorite GET] Error:', error);
    // Return [] instead of 500 to prevent app crashes if Firebase hangs
    return NextResponse.json({ favorites: [], error: String(error) }, { status: 200 });
  }
}
