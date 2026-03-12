// 동탄2신도시 7대 투자 권역 정의
// dong 필드 → zone 매핑 + 각 권역별 설명 및 메타데이터

export interface ZoneInfo {
  id: string;
  name: string;
  dongLabel: string; // 괄호 안 행정동 표시
  description: string;
  color: string; // 테마 컬러 (배지 등)
}

export const ZONES: ZoneInfo[] = [
  {
    id: 'metropolis',
    name: '메타폴리스 & 중상지구',
    dongLabel: '동탄 1동',
    description: 'Zero-Duration의 성숙 권역. 가장 강력한 방어적 팩터를 지니며 고수익 채권 대용(Bond Proxy) 자산군.',
    color: '#191f28',
  },
  {
    id: 'community',
    name: '커뮤니티시범단지',
    dongLabel: '동탄 4동',
    description: '주거 Core 권역. 학군·근린 인프라 성숙 기반 Low Volatility Anchor 자산.',
    color: '#3182f6',
  },
  {
    id: 'gbcx',
    name: '광역비즈니스콤플렉스',
    dongLabel: '동탄 6동 · 오산동',
    description: 'GTX-A, SRT 결절점. 수도권 남부 유동성을 흡수하는 High-Beta 자산군.',
    color: '#f04452',
  },
  {
    id: 'techno',
    name: '동탄테크노밸리',
    dongLabel: '영천동',
    description: '산업·R&D Cluster. 반도체 밸류체인 연동 Growth Factor 보유.',
    color: '#03c75a',
  },
  {
    id: 'culture',
    name: '문화디자인밸리',
    dongLabel: '1·2신도시 경계',
    description: '문화·주거 혼합 권역. 구도심-신도심 인프라 동시 향유의 입지적 Arbitrage.',
    color: '#8b5cf6',
  },
  {
    id: 'waterfront',
    name: '워터프론트콤플렉스',
    dongLabel: '동탄 7동 · 송동',
    description: '동탄호수공원 기반 상업·여가 권역. 소비 방어력이 뛰어난 Cash Cow.',
    color: '#0ea5e9',
  },
  {
    id: 'newtown',
    name: '신주거문화타운',
    dongLabel: '동탄 8·9동',
    description: '장기 듀레이션 외곽 주거 권역. 인프라 초기 단계 Deep Value 투자.',
    color: '#f59e0b',
  },
];

// 관리자 폼의 dong 값 → zone id 매핑
// FALLBACK_DONG_DATA의 키 기준
const DONG_TO_ZONE_MAP: Record<string, string> = {
  // 메타폴리스 및 중심상업지구 (동탄 1동)
  '목동 (중동탄)': 'metropolis',

  // 커뮤니티시범단지 (동탄 4동)
  '청계동 (시범단지)': 'community',

  // 광역비즈니스콤플렉스 (동탄 6동, 오산동)
  '여울동 (동탄역)': 'gbcx',
  '오산동 (동탄역)': 'gbcx',

  // 동탄테크노밸리 (영천동)
  '영천동 (북동탄)': 'techno',

  // 문화디자인밸리 (1·2신도시 경계)
  '석우동': 'culture',
  '장지동': 'culture',

  // 워터프론트콤플렉스 (동탄 7동, 송동)
  '송동 (남동탄/호수공원)': 'waterfront',
  '산척동 (호수공원)': 'waterfront',

  // 신주거문화타운 (동탄 8, 9동)
  '능동': 'newtown',
  '반송동': 'newtown',
  '신동': 'newtown',
};

/**
 * dong 문자열을 zone id로 변환
 * 매핑에 없으면 '기타' → 가장 가까운 권역으로 fallback
 */
export function dongToZoneId(dong: string | undefined): string {
  if (!dong) return 'gbcx'; // 기본값: 광역비즈니스콤플렉스
  return DONG_TO_ZONE_MAP[dong] || 'gbcx';
}

export function getZoneById(zoneId: string): ZoneInfo | undefined {
  return ZONES.find(z => z.id === zoneId);
}

// 관리자 폼에서 사용할 dong → zone 이름 표시용
export function getDongZoneLabel(dong: string): string {
  const zoneId = DONG_TO_ZONE_MAP[dong];
  if (!zoneId) return '';
  const zone = getZoneById(zoneId);
  return zone ? zone.name : '';
}
