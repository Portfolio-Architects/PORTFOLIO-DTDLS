/**
 * 아파트 브랜드 → 영문 이니셜 + 브랜드 컬러 매핑
 * 토스증권 주식 아이콘 스타일의 이니셜 아바타에 사용
 */

interface BrandStyle {
  initial: string;
  color: string;
}

const BRAND_MAP: Record<string, BrandStyle> = {
  // 대림
  '푸르지오': { initial: 'P', color: '#6B4EFF' },
  'e편한세상': { initial: 'e', color: '#00ACC1' },
  // 현대
  '힐스테이트': { initial: 'H', color: '#E53935' },
  '디에이치': { initial: 'DH', color: '#C62828' },
  // GS
  '자이': { initial: 'X', color: '#00897B' },
  // 삼성
  '래미안': { initial: 'R', color: '#1565C0' },
  // 반도
  '유보라': { initial: 'U', color: '#F57C00' },
  '반도': { initial: 'B', color: '#5C6BC0' },
  // 호반
  '호반': { initial: 'Hb', color: '#2E7D32' },
  '호반써밋': { initial: 'Hb', color: '#2E7D32' },
  // 한화
  '포레나': { initial: 'Fr', color: '#FF6F00' },
  '한화': { initial: 'Hw', color: '#FF6F00' },
  // 현대엔지니어링
  '아이파크': { initial: 'I', color: '#283593' },
  // 롯데
  '롯데캐슬': { initial: 'L', color: '#AD1457' },
  '캐슬': { initial: 'L', color: '#AD1457' },
  // 대우건설
  '푸르지오시티': { initial: 'P', color: '#6B4EFF' },
  // SK
  'SK뷰': { initial: 'SK', color: '#E64A19' },
  // 포스코
  '더샵': { initial: 'S', color: '#0277BD' },
  // 금호
  '어울림': { initial: 'A', color: '#6D4C41' },
  // 동원
  '동원로얄듀크': { initial: 'D', color: '#37474F' },
  // 우미
  '린': { initial: 'Rn', color: '#7B1FA2' },
  '우미': { initial: 'W', color: '#7B1FA2' },
  // 중흥
  'S클래스': { initial: 'SC', color: '#1B5E20' },
  // 시티
  '시티프라디움': { initial: 'Ct', color: '#4527A0' },
  // 제일풍경채
  '제일풍경채': { initial: 'J', color: '#00695C' },
};

/**
 * 아파트 이름이나 브랜드에서 이니셜과 컬러를 추출합니다.
 * 1차: apt.brand로 직접 매핑
 * 2차: 아파트 이름에서 브랜드 키워드 검색
 * 3차: 이름 첫 글자 + 기본 그레이
 */
export function getBrandStyle(aptName: string, brand?: string): BrandStyle {
  // 1차: brand 필드 매핑
  if (brand) {
    for (const [key, style] of Object.entries(BRAND_MAP)) {
      if (brand.includes(key)) return style;
    }
  }

  // 2차: 아파트 이름에서 브랜드 키워드 검색
  for (const [key, style] of Object.entries(BRAND_MAP)) {
    if (aptName.includes(key)) return style;
  }

  // 3차: 이름 첫 글자 기반 동적 생성
  const firstChar = aptName.charAt(0);
  // 한글 첫 자음으로 일관된 색상 생성
  const code = firstChar.charCodeAt(0);
  const hue = (code * 137) % 360; // 골든 앵글로 분산
  return {
    initial: firstChar,
    color: `hsl(${hue}, 45%, 45%)`,
  };
}
