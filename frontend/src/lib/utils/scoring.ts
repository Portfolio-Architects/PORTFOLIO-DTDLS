import { ObjectiveMetrics } from '../types/scoutingReport';

export interface PremiumScores {
  education: number;      // 🎓 학군 (0-100)
  transport: number;      // 🚇 교통 (0-100)
  livingComfort: number;  // 🅿️ 주거 쾌적 (0-100)
  complex: number;        // 🏢 단지 경쟁력 (0-100)
  lifestyle: number;      // 🍽️ 생활 인프라 (0-100)
  totalScore: number;     // 종합 점수 (0-100)

  // Legacy aliases (backward compat — gradually deprecate)
  eduTimePremium: number;
  stressFreeParking: number;
  commuteFrictional: number;
  megaScaleLiquidity: number;
  totalPremiumScore: number;
}

// 브랜드별 가산점 (시공사 인지도 + 프리미엄)
const BRAND_BONUS: Record<string, number> = {
  '래미안': 10, '자이': 10, '디에이치': 12,
  '힐스테이트': 8, '푸르지오': 7, '더샵': 7,
  '롯데캐슬': 6, '아이파크': 6, 'e편한세상': 5,
  '해링턴': 4, '제일풍경채': 4, '호반써밋': 3,
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * 5대 핵심 영역 프리미엄 점수를 산출합니다.
 * 각 영역 0~100점, 종합점수 = 가중 평균.
 *
 * 가중치:
 *  🎓 학군        25%  — 초등거리·중등거리·학원밀집도
 *  🚇 교통        25%  — GTX역·인덕원선·트램
 *  🅿️ 주거 쾌적   20%  — 주차대수·건폐율·용적률
 *  🏢 단지 경쟁력  15%  — 세대수·브랜드·준공연도
 *  🍽️ 생활 인프라  15%  — 음식점밀집도·카페·학원외
 */
export function calculatePremiumScores(metrics: ObjectiveMetrics | undefined): PremiumScores {
  const zero: PremiumScores = {
    education: 0, transport: 0, livingComfort: 0, complex: 0, lifestyle: 0, totalScore: 0,
    eduTimePremium: 0, stressFreeParking: 0, commuteFrictional: 0, megaScaleLiquidity: 0, totalPremiumScore: 0,
  };
  if (!metrics) return zero;

  // ─────────────────────────────────────────────
  // 1. 🎓 학군 (25%)
  // 초등 거리(40%) + 중학교 거리(20%) + 학원 밀집도(40%)
  // ─────────────────────────────────────────────
  const elemScore = clamp(100 - (metrics.distanceToElementary / 10));   // 0m=100, 1000m=0
  const middleScore = clamp(100 - (metrics.distanceToMiddle / 15));     // 0m=100, 1500m=0
  const academyScore = clamp((metrics.academyDensity / 80) * 100);     // 80개=100점
  const education = (elemScore * 0.4) + (middleScore * 0.2) + (academyScore * 0.4);

  // ─────────────────────────────────────────────
  // 2. 🚇 교통 (25%)
  // GTX/SRT(50%) + 인덕원선(25%) + 트램(25%)
  // 미입력 역은 해당 비중을 GTX에 합산
  // ─────────────────────────────────────────────
  const gtxScore = clamp(100 - (metrics.distanceToSubway / 15));       // 0m=100, 1500m=0
  const indeokScore = metrics.distanceToIndeokwon != null
    ? clamp(100 - ((metrics.distanceToIndeokwon) / 20))                // 0m=100, 2000m=0
    : null;
  const tramScore = metrics.distanceToTram != null
    ? clamp(100 - ((metrics.distanceToTram) / 20))
    : null;

  let transport: number;
  if (indeokScore != null && tramScore != null) {
    transport = (gtxScore * 0.5) + (indeokScore * 0.25) + (tramScore * 0.25);
  } else if (indeokScore != null) {
    transport = (gtxScore * 0.6) + (indeokScore * 0.4);
  } else if (tramScore != null) {
    transport = (gtxScore * 0.6) + (tramScore * 0.4);
  } else {
    transport = gtxScore;
  }

  // ─────────────────────────────────────────────
  // 3. 🅿️ 주거 쾌적 (20%)
  // 주차대수(50%) + 건폐율(25%) + 용적률(25%)
  // ─────────────────────────────────────────────
  let parkingScore: number;
  if (metrics.parkingPerHousehold >= 1.5) {
    parkingScore = 90 + ((metrics.parkingPerHousehold - 1.5) / 0.5) * 10;
  } else if (metrics.parkingPerHousehold >= 1.0) {
    parkingScore = 50 + ((metrics.parkingPerHousehold - 1.0) / 0.5) * 40;
  } else {
    parkingScore = (metrics.parkingPerHousehold / 1.0) * 50;
  }
  parkingScore = clamp(parkingScore);

  // 건폐율: 낮을수록 좋음 (10%=100점, 25%=0점)
  const bcrScore = clamp(100 - ((metrics.bcr - 10) / 15) * 100);

  // 용적률: 낮을수록 좋음 (180%=100점, 350%=0점)
  const farScore = clamp(100 - ((metrics.far - 180) / 170) * 100);

  const livingComfort = (parkingScore * 0.5) + (bcrScore * 0.25) + (farScore * 0.25);

  // ─────────────────────────────────────────────
  // 4. 🏢 단지 경쟁력 (15%)
  // 세대수(50%) + 브랜드(25%) + 연식(25%)
  // ─────────────────────────────────────────────
  let sizeScore: number;
  if (metrics.householdCount >= 3000) sizeScore = 100;
  else if (metrics.householdCount >= 1500) sizeScore = 75 + ((metrics.householdCount - 1500) / 1500) * 25;
  else if (metrics.householdCount >= 500) sizeScore = 30 + ((metrics.householdCount - 500) / 1000) * 45;
  else sizeScore = (metrics.householdCount / 500) * 30;
  sizeScore = clamp(sizeScore);

  // 브랜드 가산
  let brandScore = 40; // 기본 (무브랜드)
  for (const [brand, bonus] of Object.entries(BRAND_BONUS)) {
    if (metrics.brand?.includes(brand)) {
      brandScore = 40 + bonus * 6; // 래미안: 40 + 60 = 100
      break;
    }
  }
  brandScore = clamp(brandScore);

  // 연식: 신축일수록 높은 점수
  const currentYear = new Date().getFullYear();
  const age = currentYear - (metrics.yearBuilt || currentYear);
  let ageScore: number;
  if (age <= 5) ageScore = 100;
  else if (age <= 10) ageScore = 80 + ((10 - age) / 5) * 20;
  else if (age <= 20) ageScore = 40 + ((20 - age) / 10) * 40;
  else ageScore = Math.max(10, 40 - (age - 20) * 2);
  ageScore = clamp(ageScore);

  const complex = (sizeScore * 0.5) + (brandScore * 0.25) + (ageScore * 0.25);

  // ─────────────────────────────────────────────
  // 5. 🍽️ 생활 인프라 (15%)
  // 음식점 밀집도 (100%)  
  // ─────────────────────────────────────────────
  const restDensity = metrics.restaurantDensity ?? 0;
  const lifestyle = clamp((restDensity / 60) * 100); // 60개=100점

  // ─────────────────────────────────────────────
  // 종합 점수 (가중 평균)
  // ─────────────────────────────────────────────
  const totalScore =
    (education * 0.25) +
    (transport * 0.25) +
    (livingComfort * 0.20) +
    (complex * 0.15) +
    (lifestyle * 0.15);

  const result: PremiumScores = {
    education: Math.round(education),
    transport: Math.round(transport),
    livingComfort: Math.round(livingComfort),
    complex: Math.round(complex),
    lifestyle: Math.round(lifestyle),
    totalScore: Math.round(totalScore),
    // Legacy aliases (for existing data in Firestore that uses old field names)
    eduTimePremium: Math.round(education),
    stressFreeParking: Math.round(livingComfort),
    commuteFrictional: Math.round(transport),
    megaScaleLiquidity: Math.round(complex),
    totalPremiumScore: Math.round(totalScore),
  };

  return result;
}
