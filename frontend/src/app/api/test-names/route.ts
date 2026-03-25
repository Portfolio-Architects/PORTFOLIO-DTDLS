import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import fs from 'fs';

export async function GET() {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Admin DB not initialized' }, { status: 500 });
    const snap = await adminDb.collection('scoutingReports').get();
    const names = snap.docs.map(d => ({
      id: d.id,
      apartmentName: d.data().apartmentName,
      dong: d.data().dong
    }));
    fs.writeFileSync('C:\\tmp\\test-names-node.json', JSON.stringify(names, null, 2), 'utf8');
    return NextResponse.json(names);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
