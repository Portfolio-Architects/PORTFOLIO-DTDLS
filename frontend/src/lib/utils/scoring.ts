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

/**
 * 브랜드별 위험 조정 승수 (μ, Risk-Adjusted Multiplier)
 *
 * PUR 밸류에이션의 최종 산출 연산 변수.
 * 전국 단위 기초 프리미엄(α), 지역별 시장 지배력(β),
 * 이벤트 드리븐 리스크 패널티(γ)를 통합한 계량적 결과물.
 *
 * μ > 1.0: 자본 조달 우위 + 초과 수요 창출
 * μ < 1.0: 구조적 디스카운트 + 리스크 전가
 */
interface BrandTier {
  tier: number;
  mu: number;       // 위험 조정 승수 (midpoint)
  brands: string[]; // 매칭 키워드 (아파트명에 포함 여부로 판정)
}

const BRAND_TIERS: BrandTier[] = [
  // Tier 1: High-End Core — μ = 1.12~1.15
  { tier: 1, mu: 1.135, brands: ['디에이치', '아크로', '르엘', '써밋'] },
  // Tier 2: Top-Tier Major — μ = 1.08~1.10
  { tier: 2, mu: 1.09, brands: ['래미안', '힐스테이트'] },
  // Tier 3: Upper Major — μ = 1.05~1.07
  { tier: 3, mu: 1.06, brands: ['자이', '푸르지오', 'e편한세상', '더샵'] },
  // Tier 4: Risk-Managed Major — μ = 1.02~1.04
  { tier: 4, mu: 1.03, brands: ['롯데캐슬', '아이파크', 'SK뷰', '포레나'] },
  // Tier 5: New Town Leading — μ = 1.01~1.03
  { tier: 5, mu: 1.02, brands: ['호반써밋', '우미린', '제일풍경채', '중흥S-클래스', '중흥'] },
  // Tier 6: Traditional Regional — μ = 0.99~1.01
  { tier: 6, mu: 1.00, brands: ['하늘채', '어울림', '유보라', '센트레빌', '엘리프'] },
  // Tier 7: Risk Exposed Mid-size — μ = 0.95~0.98
  { tier: 7, mu: 0.965, brands: ['데시앙', '스타힐스', '스위첸', '빌리브'] },
  // Tier 8: Public & Micro — μ = 0.90~0.95
  { tier: 8, mu: 0.925, brands: ['안단테'] },
];

/** μ 범위: 0.90 ~ 1.15 → 0 ~ 100 선형 매핑 */
const MU_MIN = 0.90;
const MU_MAX = 1.15;
const MU_DEFAULT = 0.925; // Tier 8 (비브랜드 기본값)

/**
 * 아파트명에서 브랜드 승수(μ)를 조회합니다.
 * @param brand 시공사/브랜드명 (아파트명에서 매칭)
 * @returns μ 값 (기본 0.925)
 */
export function getBrandMultiplier(brand: string | undefined): number {
  if (!brand) return MU_DEFAULT;
  for (const tier of BRAND_TIERS) {
    for (const keyword of tier.brands) {
      if (brand.includes(keyword)) return tier.mu;
    }
  }
  return MU_DEFAULT;
}


function clamp(v: number, min = 0): number {
  return Math.max(min, v);
}

/**
 * 5대 핵심 영역 프리미엄 점수를 산출합니다.
 * 각 영역, 종합점수 = 가중 평균.
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
  const gtxScore = clamp(100 - (metrics.distanceToSubway / 15)) * 3;   // GTX 가중치 3배
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

  // 브랜드 승수(μ) → 0~100 점수 선형 매핑
  const mu = getBrandMultiplier(metrics.brand);
  const brandScore = clamp(((mu - MU_MIN) / (MU_MAX - MU_MIN)) * 100);

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
  // 음식점 밀집도 (60%) + 앵커 테넌트 근접도 (40%)
  // ─────────────────────────────────────────────
  const restDensity = metrics.restaurantDensity ?? 0;
  const restScore = clamp((restDensity / 60) * 100); // 60개=100점

  // 앵커 테넌트 근접도: 각 테넌트 거리 → 0~100 점수, 평균
  const anchorDistances: number[] = [];
  if (metrics.distanceToStarbucks != null) anchorDistances.push(clamp(100 - (metrics.distanceToStarbucks / 10)));
  if (metrics.distanceToOliveYoung != null) anchorDistances.push(clamp(100 - (metrics.distanceToOliveYoung / 10)));
  if (metrics.distanceToDaiso != null) anchorDistances.push(clamp(100 - (metrics.distanceToDaiso / 10)));
  if (metrics.distanceToSupermarket != null) anchorDistances.push(clamp(100 - (metrics.distanceToSupermarket / 15))); // 대형마트는 1500m 반경
  if (metrics.distanceToMcDonalds != null) anchorDistances.push(clamp(100 - (metrics.distanceToMcDonalds / 10)));

  const lifestyle = anchorDistances.length > 0
    ? (restScore * 0.6) + ((anchorDistances.reduce((a, b) => a + b, 0) / anchorDistances.length) * 0.4)
    : restScore; // 앵커 데이터 없으면 음식점 100% 폴백

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
