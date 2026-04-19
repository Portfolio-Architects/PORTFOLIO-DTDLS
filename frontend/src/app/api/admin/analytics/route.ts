import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { verifyAdmin } from '@/lib/authUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GA_PROPERTY_ID } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GA_PROPERTY_ID) {
      return NextResponse.json({ error: 'Missing GA credentials in env' }, { status: 500 });
    }

    const formattedKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formattedKey,
      },
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '14daysAgo', // 최근 2주
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        {
          name: 'activeUsers', // 봇 필터링된 순수 유저
        },
        {
          name: 'screenPageViews', // 페이지 뷰 총합
        }
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: false, // 오름차순 (과거 -> 현재)
        }
      ]
    });

    if (!response || !response.rows) {
       return NextResponse.json({ data: [] });
    }

    const data = response.rows.map((row) => {
      // date dimension format is 'YYYYMMDD', format to 'YYYY-MM-DD'
      const rawDate = row.dimensionValues?.[0]?.value || '';
      const formattedDate = rawDate.length === 8 
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` 
        : rawDate;

      return {
        date: formattedDate,
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
        pageViews: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    });

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('[GA4 API] Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error)?.message }, { status: 500 });
  }
}
