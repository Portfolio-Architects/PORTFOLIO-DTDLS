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

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const { aptName, userId } = await request.json();
    if (!aptName || !userId) {
      return NextResponse.json({ error: 'aptName and userId are required' }, { status: 400 });
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
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await favRef.set({ userId, aptName, createdAt: FieldValue.serverTimestamp() });
      // Increment count
      const countRef = adminDb.collection('favoriteCounts').doc(aptName);
      await countRef.set({ count: FieldValue.increment(1), aptName }, { merge: true });
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
    if (!adminDb) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const snap = await adminDb.collection('favorites').where('userId', '==', userId).get();
    const favorites = snap.docs.map(d => d.data().aptName as string);
    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error('[favorite GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 });
  }
}
