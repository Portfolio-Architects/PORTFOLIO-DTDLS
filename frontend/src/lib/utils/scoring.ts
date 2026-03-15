import { ObjectiveMetrics } from '../types/scoutingReport';

export interface PremiumScores {
  eduTimePremium: number;       // 0-100 (교육 환경)
  stressFreeParking: number;    // 0-100 (주차 쾌적성)
  commuteFrictional: number;    // 0-100 (교통 편의)
  megaScaleLiquidity: number;   // 0-100 (단지 규모)
  totalPremiumScore: number;    // 0-100 (종합 점수)
}

/**
 * 4대 핵심 지표를 계산하여 아파트 프리미엄 점수를 산출합니다.
 * 각 지표는 0~100점이며, 종합 점수는 가중 평균입니다.
 *
 * 가중치 배분 원칙:
 * - 교육·교통은 독립적으로 가격에 큰 영향 → 높은 비중 (각 35%)
 * - 주차는 대단지일수록 좋은 경향이 있어 규모와 겹침 → 중간 비중 (20%)
 * - 단지 규모는 주차·건폐율과 겹칠 수 있으므로 → 낮은 비중 (10%)
 */
export function calculatePremiumScores(metrics: ObjectiveMetrics | undefined): PremiumScores {
  if (!metrics) {
    return { eduTimePremium: 0, stressFreeParking: 0, commuteFrictional: 0, megaScaleLiquidity: 0, totalPremiumScore: 0 };
  }

  // ---------------------------------------------------------
  // 1. 교육 환경 점수
  // - 초등학교 거리: 가까울수록 높은 점수 (0m=100점, 1500m=0점)
  // - 학원가 밀집도: 반경 1km 내 학원 수 (100개 이상=만점)
  // - 배분: 학교 거리 50% + 학원 밀집도 50%
  // ---------------------------------------------------------
  const schoolScore = Math.max(0, 100 - (metrics.distanceToElementary / 15)); 
  const academyScore = Math.min(100, (metrics.academyDensity / 100) * 100);
  const eduTimePremium = (schoolScore * 0.5) + (academyScore * 0.5);

  // ---------------------------------------------------------
  // 2. 주차 쾌적성 점수
  // - 세대당 주차 대수: 1.3대 이상이면 기본 50점 + 가산
  // - 건폐율(건물 밀집도): 15% 이하면 가산, 넘으면 감점
  // - 배분: 주차 60% + 건폐율 40%
  // ---------------------------------------------------------
  let parkingScore = 0;
  if (metrics.parkingPerHousehold >= 1.3) {
    parkingScore = 50 + ((metrics.parkingPerHousehold - 1.3) / 0.7) * 50; 
  } else {
    parkingScore = (metrics.parkingPerHousehold / 1.3) * 50;
  }
  parkingScore = Math.min(100, parkingScore);
  
  let bcrScore = 0;
  if (metrics.bcr <= 15) {
    bcrScore = 60 + ((15 - metrics.bcr) / 5) * 40;
  } else {
    bcrScore = Math.max(0, 60 - ((metrics.bcr - 15) / 10) * 60);
  }
  bcrScore = Math.min(100, bcrScore);

  const stressFreeParking = (parkingScore * 0.6) + (bcrScore * 0.4);

  // ---------------------------------------------------------
  // 3. 교통 편의 점수
  // - GTX-A/SRT역까지 거리: 가까울수록 높은 점수 (0m=100점, 2000m=0점)
  // ---------------------------------------------------------
  const commuteFrictional = Math.max(0, 100 - (metrics.distanceToSubway / 20));

  // ---------------------------------------------------------
  // 4. 단지 규모 점수
  // - 세대수 기반: 2000세대 이상 100점, 1000세대 이상 80점~
  // - 대단지일수록 커뮤니티·관리비·환금성에 유리
  // ---------------------------------------------------------
  let megaScaleLiquidity = 0;
  if (metrics.householdCount >= 2000) {
    megaScaleLiquidity = 100;
  } else if (metrics.householdCount >= 1000) {
    megaScaleLiquidity = 80 + ((metrics.householdCount - 1000) / 1000) * 20;
  } else if (metrics.householdCount >= 500) {
    megaScaleLiquidity = 50 + ((metrics.householdCount - 500) / 500) * 30;
  } else {
    megaScaleLiquidity = (metrics.householdCount / 500) * 50;
  }
  megaScaleLiquidity = Math.min(100, megaScaleLiquidity);

  // ---------------------------------------------------------
  // 5. 종합 점수 (가중 평균)
  // - 교육·교통은 독립적 변수이므로 각 35%
  // - 주차는 규모와 일부 겹치므로 20%
  // - 규모는 다른 지표와 겹칠 수 있어 10%
  // ---------------------------------------------------------
  const totalPremiumScore = 
    (eduTimePremium * 0.35) +
    (commuteFrictional * 0.35) +
    (stressFreeParking * 0.20) +
    (megaScaleLiquidity * 0.10);

  return {
    eduTimePremium: Math.round(eduTimePremium),
    stressFreeParking: Math.round(stressFreeParking),
    commuteFrictional: Math.round(commuteFrictional),
    megaScaleLiquidity: Math.round(megaScaleLiquidity),
    totalPremiumScore: Math.round(totalPremiumScore)
  };
}
