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

export const dynamic = 'force-dynamic';

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

    const { aptName } = await request.json();
    if (!aptName) {
      return NextResponse.json({ error: 'aptName is required' }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error('[favorite] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 });
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
  } catch (error: any) {
    console.error('[favorite GET] Error:', error);
    // Return [] instead of 500 to prevent app crashes if Firebase hangs
    return NextResponse.json({ favorites: [], error: String(error) }, { status: 200 });
  }
}
