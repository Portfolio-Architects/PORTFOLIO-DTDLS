/**
 * GET /api/cron/sync-transactions
 * 
 * 국토교통부 실거래가 API → Firestore 'transactions' 신규 거래 동기화
 * Vercel Cron에서 매일 1회 호출 (vercel.json에서 설정)
 * 수동 호출도 가능: fetch('/api/cron/sync-transactions')
 */
import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.BUILDING_API_KEY || '';
const LAWD_CD = '41597'; // 동탄구
const API_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

interface GovApiItem {
  aptNm: string;
  dealAmount: string;
  dealDay: string;
  dealMonth: string;
  dealYear: string;
  excluUseAr: string;
  floor: string;
  buildYear: string;
  umdNm: string;
  roadNm: string;
  buyerGbn: string;
  slerGbn: string;
  cdealDay: string;
  cdealType: string;
  dealingGbn: string;
  estateAgentSggNm: string;
  rgstDate: string;
  sggCd: string;
}

function extractDong(umdNm: string): string {
  return umdNm || '';
}

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: 'BUILDING_API_KEY not set' }, { status: 500 });
    }
    if (!db) {
      return NextResponse.json({ error: 'Firebase DB not initialized' }, { status: 500 });
    }

    // 1. Find the latest contractDate in Firestore to determine sync range
    const collRef = db.collection('transactions');
    const latestSnap = await collRef.orderBy('contractDate', 'desc').limit(1).get();
    
    let latestYm = '';
    if (!latestSnap.empty) {
      const latestDoc = latestSnap.docs[0].data();
      latestYm = latestDoc.contractYm || '';
    }

    // 2. Determine months to sync (latest month + current month)
    const now = new Date();
    const currentYm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthsToSync = new Set<string>();
    
    if (latestYm) {
      monthsToSync.add(latestYm); // Re-sync latest month (may have new entries)
    }
    monthsToSync.add(currentYm); // Always sync current month
    
    // Also add previous month if we're early in the month (data delay)
    if (now.getDate() <= 15) {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      monthsToSync.add(`${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
    }

    // 3. Fetch from 국토부 API for each month
    let totalNew = 0;
    const syncLog: string[] = [];

    for (const ym of Array.from(monthsToSync).sort()) {
      let page = 1;
      let totalCount = 0;
      const monthRecords: unknown[] = [];

      do {
        const url = `${API_BASE}?serviceKey=${API_KEY}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`;
        const res = await fetch(url);
        if (!res.ok) { syncLog.push(`${ym} page ${page}: HTTP ${res.status}`); break; }

        const text = await res.text();
        // Parse XML response
        const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
        totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;

        if (totalCount === 0) break;

        // Extract items using regex (simple XML parsing)
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const itemXml of items) {
          // Single-pass: extract ALL tags into a Map (O(1) lookups)
          // Previously: 12x new RegExp() per item -> now 1x regex scan
          const tagMap = new Map<string, string>();
          const tagRegex = /<([^>]+)>([^<]*)<\/\1>/g;
          let tagMatch;
          while ((tagMatch = tagRegex.exec(itemXml)) !== null) {
            tagMap.set(tagMatch[1], tagMatch[2].trim());
          }
          const get = (tag: string) => tagMap.get(tag) || '';

          const aptName = get('aptNm');
          const priceStr = get('dealAmount').replace(/,/g, '').trim();
          const price = parseInt(priceStr, 10) || 0;
          const area = parseFloat(get('excluUseAr')) || 0;
          const contractDay = get('dealDay').padStart(2, '0');
          const floor = parseInt(get('floor'), 10) || 0;
          const dong = get('umdNm');

          const record = {
            sigungu: `경기도 화성시 동탄구 ${dong}`,
            dong,
            aptName,
            area,
            areaPyeong: Math.round(area / 3.3058 * 10) / 10,
            contractYm: ym,
            contractDay,
            contractDate: `${ym}${contractDay}`,
            price,
            floor,
            buyer: get('buyerGbn'),
            seller: get('slerGbn'),
            buildYear: parseInt(get('buildYear'), 10) || 0,
            roadName: get('roadNm'),
            cancelDate: get('cdealDay') || '',
            dealType: get('cdealType') || get('dealingGbn') || '',
            agentLocation: get('estateAgentSggNm'),
            registrationDate: get('rgstDate'),
            housingType: '',
            source: 'govt_api',
            _key: `${aptName}_${ym}_${contractDay}_${area}_${price}_${floor}`,
          };

          monthRecords.push(record);
        }

        page++;
      } while (monthRecords.length < totalCount);

      // 4. Batch write to Firestore
      if (monthRecords.length > 0) {
        const BATCH_SIZE = 500;
        let written = 0;
        for (let i = 0; i < monthRecords.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const slice = monthRecords.slice(i, i + BATCH_SIZE);
          for (const r of (slice as Record<string, unknown>[])) {
            batch.set(collRef.doc(r._key as string), r, { merge: true });
          }
          await batch.commit();
          written += slice.length;
        }
        totalNew += written;
        syncLog.push(`${ym}: ${written}건 동기화`);
      } else {
        syncLog.push(`${ym}: 0건`);
      }
    }

    // 5. Trigger Vercel Deploy Hook if there are new transactions
    if (totalNew > 0 && process.env.VERCEL_DEPLOY_HOOK_URL) {
      try {
        const deployRes = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
        if (deployRes.ok) {
          syncLog.push('Vercel Deploy Hook Triggered Successfully');
        } else {
          syncLog.push(`Vercel Deploy Hook Failed: HTTP ${deployRes.status}`);
        }
      } catch (err) {
        syncLog.push(`Vercel Deploy Hook Error: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalNew,
      months: Array.from(monthsToSync),
      log: syncLog,
    });
  } catch (error: unknown) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
