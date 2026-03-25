/**
 * GET /api/dashboard-init
 * 
 * Consolidated API: replaces 3 separate calls:
 *   /api/favorite-counts  → favoriteCounts
 *   /api/type-map          → typeMap
 *   Firestore settings/apartmentMeta → apartmentMeta
 * 
 * Single serverless cold-start instead of 3.
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

export const revalidate = 300; // 5분 ISR 캐시

export async function GET() {
  const result: {
    favoriteCounts: Record<string, number>;
    typeMap: { aptName: string; area: string; typeM2: string; typePyeong: string }[];
    apartmentMeta: Record<string, unknown>;
  } = {
    favoriteCounts: {},
    typeMap: [],
    apartmentMeta: {},
  };

  // 1. Favorite counts (Firebase Admin)
  try {
    if (adminDb) {
      const snap = await adminDb.collection('favoriteCounts').get();
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.count > 0) {
          result.favoriteCounts[data.aptName || doc.id] = data.count;
        }
      });
    }
  } catch (e) {
    console.warn('[dashboard-init] favoriteCounts error:', e);
  }

  // 2. Type map (Google Sheets CSV — no auth needed)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.TYPE_MAP)}`;
    const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split('\n').filter(l => l.trim());
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 3) continue;
        const aptName = cols[1]?.trim();
        const area = cols[2]?.trim();
        const typeM2 = cols[3]?.trim() || '';
        const typePyeong = cols[5]?.trim() || '';
        if (aptName && area && (typeM2 || typePyeong)) {
          result.typeMap.push({ aptName, area, typeM2, typePyeong });
        }
      }
    }
  } catch (e) {
    console.warn('[dashboard-init] typeMap error:', e);
  }

  // 3. Apartment meta (Firebase Admin — name mapping + public rental)
  try {
    if (adminDb) {
      const metaDoc = await adminDb.doc('settings/apartmentMeta').get();
      if (metaDoc.exists) {
        result.apartmentMeta = metaDoc.data() || {};
      }
    }
  } catch (e) {
    console.warn('[dashboard-init] apartmentMeta error:', e);
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
