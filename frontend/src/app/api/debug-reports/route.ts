import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Admin DB not initialized' }, { status: 500 });
    const snapshot = await adminDb.collection('scoutingReports').get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      apartmentName: doc.data().apartmentName,
      apartmentNameHex: Buffer.from(doc.data().apartmentName || '').toString('hex'),
      dong: doc.data().dong
    }));
    return NextResponse.json({ count: reports.length, reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
