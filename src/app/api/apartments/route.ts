'use server';

import { NextResponse } from 'next/server';

// 국토교통부 실거래가 Open API를 서버 사이드에서 호출하여
// 동탄(화성시) 지역 아파트 목록을 행정동별로 그룹핑해서 반환합니다.
export async function GET() {
  const API_KEY = '4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff';
  const LAWD_CD = '41590'; // 화성시
  
  // 최근 6개월 치 데이터를 가져와서 최대한 많은 아파트를 커버
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  // 동탄 관련 행정동 필터 (화성시 전체에서 동탄 지역만 추출)
  const DONGTAN_DONGS = [
    '여울동', '오산동', '청계동', '목동', '송동', '산척동', '영천동',
    '반송동', '석우동', '금곡동', '방교동', '중동', '능동',
    '신동', '장지동', '망월동', '동탄'
  ];

  const dongMap: Record<string, Set<string>> = {};

  try {
    // 여러 월의 데이터를 병렬로 가져오기
    const fetchPromises = months.map(async (dealYmd) => {
      const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${API_KEY}&pageNo=1&numOfRows=1000&LAWD_CD=${LAWD_CD}&DEAL_YMD=${dealYmd}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await response.text();

        // Server-side XML parsing (no DOMParser needed)
        // Parse XML using regex for reliability across environments
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];

        for (const item of items) {
          const aptNmMatch = item.match(/<aptNm>(.*?)<\/aptNm>/);
          const umdNmMatch = item.match(/<umdNm>(.*?)<\/umdNm>/);

          if (aptNmMatch && umdNmMatch) {
            const aptNm = aptNmMatch[1].trim();
            const umdNm = umdNmMatch[1].trim();

            // 동탄 관련 행정동만 필터링
            const isDongtan = DONGTAN_DONGS.some(d => umdNm.includes(d));
            if (isDongtan) {
              if (!dongMap[umdNm]) {
                dongMap[umdNm] = new Set();
              }
              dongMap[umdNm].add(aptNm);
            }
          }
        }
      } catch (innerError) {
        clearTimeout(timeoutId);
        console.warn(`Failed to fetch for ${dealYmd}:`, innerError);
      }
    });

    await Promise.all(fetchPromises);

    // Set을 Array로 변환하고 정렬
    const result: Record<string, string[]> = {};
    for (const [dong, aptSet] of Object.entries(dongMap)) {
      result[dong] = Array.from(aptSet).sort();
    }

    // 항상 '기타' 옵션 추가
    result['기타'] = ['직접 입력'];

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // 24시간 캐시
      }
    });

  } catch (error) {
    console.error('MOLIT API 전체 실패:', error);
    
    // Fallback: 기존 하드코딩 데이터 반환
    const fallback: Record<string, string[]> = {
      '여울동': ['동탄역 롯데캐슬', '동탄역 반도유보라 아이비파크 6.0', '동탄역 반도유보라 아이비파크 7.0', '동탄역 반도유보라 아이비파크 8.0', '동탄역 파라곤'],
      '청계동': ['동탄역 시범더샵 센트럴시티', '동탄역 시범한화 꿈에그린 프레스티지', '동탄역 시범우남 퍼스트빌'],
      '목동': ['힐스테이트 동탄', 'e편한세상 동탄'],
      '송동': ['동탄린스트라우스더레이크', '동탄호수공원 아이파크'],
      '산척동': ['동탄 더샵 레이크에듀타운'],
      '영천동': ['동탄역 센트럴푸르지오', '동탄 파크자이'],
      '장지동': ['직접 입력'],
      '신동': ['직접 입력'],
      '석우동': ['직접 입력'],
      '반송동': ['직접 입력'],
      '능동': ['직접 입력'],
      '기타': ['직접 입력']
    };
    return NextResponse.json(fallback);
  }
}
