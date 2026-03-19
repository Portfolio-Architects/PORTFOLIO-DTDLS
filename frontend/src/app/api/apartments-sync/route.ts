import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { SHEET_ID, SHEET_TABS } from '@/lib/constants';

/**
 * POST /api/apartments-sync
 * 
 * 구글 시트(apartments 탭)에 데이터를 직접 쓰는(Write) 일괄(Bulk) API
 * Body: {
 *   updates: [ { ticker: '...', name: '...', updates: { '아파트명': '...', '최고층': '...', ... } }, ... ],
 *   adds: [ { name: '...', dong: '...' }, ... ],
 *   deletes: [ '아파트명1', '아파트명2' ... ]
 * }
 */
export async function POST(req: Request) {
  try {
    const { updates = [], adds = [], deletes = [] } = await req.json();

    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Server is missing Google Service Account credentials' }, { status: 500 });
    }

    const formattedKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_TABS.APARTMENTS];
    if (!sheet) return NextResponse.json({ error: `Sheet tab '${SHEET_TABS.APARTMENTS}' not found` }, { status: 500 });

    const rows = await sheet.getRows();
    const headers = sheet.headerValues.map(h => h.toLowerCase().trim());
    
    // Find column indices
    const col = (names: string[]) => sheet.headerValues[headers.findIndex(h => names.includes(h))] || names[0];
    const tickerCol = col(['ticker', '티커']);
    const nameCol = col(['아파트명', 'name', '이름']);
    const dongCol = col(['dong', '동']);
    
    let updatedCount = 0;
    let addedCount = 0;
    let deletedCount = 0;

    // 1. Deletes (Delete rows matching exact names)
    if (deletes.length > 0) {
      for (let i = rows.length - 1; i >= 0; i--) {
        const rName = rows[i].get(nameCol)?.trim();
        if (rName && deletes.includes(rName)) {
          await rows[i].delete();
          deletedCount++;
        }
      }
    }

    // Refresh rows after delete
    const currentRows = await sheet.getRows();

    // 2. Updates
    if (updates.length > 0) {
      for (const updateObj of updates) {
        // Try finding by ticker first, then by name
        let targetRow = null;
        if (updateObj.ticker) {
          targetRow = currentRows.find(r => r.get(tickerCol)?.trim() === updateObj.ticker);
        }
        if (!targetRow && updateObj.name) {
          targetRow = currentRows.find(r => r.get(nameCol)?.trim() === updateObj.name);
        }

        if (targetRow) {
          let dirty = false;
          for (const key of Object.keys(updateObj.updates)) {
            const exactHeader = sheet.headerValues.find(h => h === key || h.toLowerCase().trim() === key.toLowerCase().trim());
            if (exactHeader) {
              targetRow.set(exactHeader, String(updateObj.updates[key]));
              dirty = true;
            }
          }
          if (dirty) {
            await targetRow.save();
            updatedCount++;
          }
        }
      }
    }

    // 3. Adds
    if (adds.length > 0) {
      for (const addObj of adds) {
        const newRow: Record<string, string> = {};
        newRow[nameCol] = addObj.name;
        newRow[dongCol] = addObj.dong;
        if (addObj.txKey) newRow[col(['txkey', '실거래키'])] = addObj.txKey;
        await sheet.addRow(newRow);
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount, addedCount, deletedCount });

  } catch (err: any) {
    console.error('Google Sheets Sync Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
