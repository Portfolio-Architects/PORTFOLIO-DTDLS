/**
 * @module report-view API
 * @description Tracks report views with IP-based daily dedup and admin exclusion.
 * 
 * POST /api/report-view
 * Body: { reportId: string, userEmail?: string }
 * 
 * Anti-abuse rules:
 * - IP hashed (SHA-256) for privacy
 * - Same IP + same report => max 1 view per day
 * - Admin emails are excluded from counting
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import { ADMIN_EMAILS } from '@/lib/config/admin.config';

/** Lazy-init Firebase Admin (avoids build-time execution) */
function getAdminDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export async function POST(request: NextRequest) {
  try {
    const { reportId, userEmail } = await request.json();
    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // ── Admin exclusion ──
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ counted: false, reason: 'admin' });
    }

    // ── Extract & hash client IP ──
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const rawIp = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
    const ipHash = createHash('sha256').update(rawIp).digest('hex').slice(0, 16);

    // ── Daily dedup key: reportId_ipHash_YYYY-MM-DD ──
    const today = new Date().toISOString().slice(0, 10);
    const dedupKey = `${reportId}_${ipHash}_${today}`;

    const adminDb = getAdminDb();
    const viewRef = adminDb.collection('reportViews').doc(dedupKey);
    const viewSnap = await viewRef.get();

    if (viewSnap.exists) {
      return NextResponse.json({ counted: false, reason: 'duplicate' });
    }

    // ── Record view + increment counter atomically ──
    const batch = adminDb.batch();
    batch.set(viewRef, {
      reportId,
      ipHash,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.update(adminDb.collection('scoutingReports').doc(reportId), {
      viewCount: FieldValue.increment(1),
    });
    await batch.commit();

    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error('[report-view] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
