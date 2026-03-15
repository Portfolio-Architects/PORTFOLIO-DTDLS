/**
 * POST /api/admin/import-transactions
 * 
 * Google Sheets CSV → Firestore 'transactions' 컬렉션 일괄 Import
 * 브라우저에서 호출: fetch('/api/admin/import-transactions', { method: 'POST' })
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

function extractDong(sigungu: string): string {
  const parts = sigungu.split(' ');
  return parts[parts.length - 1] || '';
}

export async function POST() {
  try {
    // 1. Fetch CSV from Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.TRANSACTIONS)}`;
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    const csvText = await res.text();
    const lines = csvText.split('\n').filter(l => l.trim());

    // 2. Parse CSV
    const records: any[] = [];
    for (let i = 2; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 15) continue;

      const sigungu = cols[1] || '';
      const priceStr = (cols[9] || '0').replace(/,/g, '');
      const priceNum = parseInt(priceStr, 10) || 0;
      const areaNum = parseFloat(cols[6]) || 0;
      const contractYm = cols[7] || '';
      const contractDay = (cols[8] || '').padStart(2, '0');
      const floor = parseInt(cols[11], 10) || 0;
      const aptName = cols[5] || '';

      records.push({
        sigungu,
        dong: extractDong(sigungu),
        aptName,
        area: areaNum,
        areaPyeong: Math.round(areaNum / 3.3058 * 10) / 10,
        contractYm,
        contractDay,
        contractDate: `${contractYm}${contractDay}`,
        price: priceNum,
        floor,
        buyer: cols[12] || '',
        seller: cols[13] || '',
        buildYear: parseInt(cols[14], 10) || 0,
        roadName: cols[15] || '',
        cancelDate: cols[16] || '',
        dealType: cols[17] || '',
        agentLocation: cols[18] || '',
        registrationDate: cols[19] || '',
        housingType: cols[20] || '',
        source: 'sheets',
        // Dedup key
        _key: `${aptName}_${contractYm}_${contractDay}_${areaNum}_${priceNum}_${floor}`,
      });
    }

    // 3. Batch write to Firestore (200 per batch + delay to avoid rate limits)
    const BATCH_SIZE = 200;
    const collRef = collection(db, 'transactions');
    let written = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const slice = records.slice(i, i + BATCH_SIZE);
      
      for (const record of slice) {
        const docRef = doc(collRef, record._key);
        batch.set(docRef, record, { merge: true });
      }

      await batch.commit();
      written += slice.length;
      console.log(`[Import] ${written}/${records.length} (${Math.round(written / records.length * 100)}%)`);
      
      // Delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < records.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: records.length, 
      written,
      message: `${written}건 Firestore에 저장 완료` 
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
