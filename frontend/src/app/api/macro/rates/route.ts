import { NextResponse } from 'next/server';
import { MOCK_MACRO_CONFIG } from '@/lib/data/macro-config';

// ECOS API: 시장금리(일일) - 817Y002
// 국고채(3년) 코드: 0102000

export async function GET() {
  const ECOS_API_KEY = process.env.ECOS_API_KEY;
  const FALLBACK_RATE = MOCK_MACRO_CONFIG.macroEnvironment.riskFreeRate;

  // 1. API 키가 없으면 바로 Fallback 반환 (현재 신청 진행 중이신 상태를 위한 방어 로직)
  if (!ECOS_API_KEY || ECOS_API_KEY === 'pending') {
    return NextResponse.json({
      success: true,
      data: {
        riskFreeRate: FALLBACK_RATE,
        source: 'fallback_no_key',
        date: MOCK_MACRO_CONFIG.macroEnvironment.baseDate
      }
    });
  }

  try {
    // 2. 한국은행 ECOS 호출 (최근 7일치 데이터를 가져와서 가장 최근 영업일 데이터 추출)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const startDate = formatYMD(sevenDaysAgo);
    const endDate = formatYMD(today);

    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${ECOS_API_KEY}/json/kr/1/10/817Y002/D/${startDate}/${endDate}/0102000`;

    // 24시간 동안 Next.js 자체 Data Cache 유지 (하루에 딱 한 번만 한국은행 API 호출)
    const response = await fetch(url, {
      next: { revalidate: 86400 } 
    });

    if (!response.ok) {
      throw new Error(`ECOS API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    // ECOS 응답 데이터 구조 검증
    if (data.StatisticSearch && data.StatisticSearch.row && data.StatisticSearch.row.length > 0) {
      const rows = data.StatisticSearch.row;
      // 가장 최근 영업일 데이터 (배열의 마지막 요소)
      const latest = rows[rows.length - 1];
      const rate = parseFloat(latest.DATA_VALUE);
      const dateStr = latest.TIME; // YYYYMMDD
      
      return NextResponse.json({
        success: true,
        data: {
          riskFreeRate: rate,
          source: 'ecos_live',
          date: `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
        }
      });
    }

    throw new Error('No valid data in ECOS response');

  } catch (error) {
    console.error('Failed to fetch from ECOS API:', error);
    // 3. 호출 실패(네트워크 오류, 데이터 형식 오류 등) 시 서버 다운을 막기 위한 Fallback
    return NextResponse.json({
      success: true,
      data: {
        riskFreeRate: FALLBACK_RATE,
        source: 'fallback_error',
        date: MOCK_MACRO_CONFIG.macroEnvironment.baseDate
      }
    });
  }
}
