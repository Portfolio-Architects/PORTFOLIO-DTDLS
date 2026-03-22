/**
 * GET /api/favorite-counts
 * Returns favorite counts for all apartments.
 * Response: { counts: Record<string, number> }
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!adminDb) return NextResponse.json({ counts: {} });

    const snap = await adminDb.collection('favoriteCounts').get();
    const counts: Record<string, number> = {};
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (data.count > 0) {
        counts[data.aptName || doc.id] = data.count;
      }
    });
    return NextResponse.json({ counts });
  } catch (error) {
    console.error('[favorite-counts] Error:', error);
    return NextResponse.json({ counts: {} });
  }
}
