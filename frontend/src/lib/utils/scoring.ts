import { ObjectiveMetrics } from '../types/scoutingReport';

export interface PremiumScores {
  eduTimePremium: number;       // 0-100 (육아·교육 타임세이브 지수)
  stressFreeParking: number;    // 0-100 (주차 쾌적성 지표)
  commuteFrictional: number;    // 0-100 (직주근접 마찰비용 역산 지표)
  megaScaleLiquidity: number;   // 0-100 (메가-단지 스케일 프리미엄)
  totalPremiumScore: number;    // 0-100 (종합 프리미엄 점수)
}

/**
 * Pure functions to calculate the 4 derivative premium metrics and the Total Score.
 * This function guarantees no side effects and calculates normalized scores based strictly on raw data.
 * 
 * Constraint Checklist:
 * 1. Edu-Time: Inverse of school distance + weighted academy density.
 * 2. Stress-Free: Step-function (parking >= 1.3, BCR < 15% gives bonus).
 * 3. Commute Frictional: Inverse penalty on subway distance.
 * 4. Mega-Scale: Step-up (1000+, 2000+).
 * 5. Multicollinearity Control: Dampen scale weight to avoid double-counting with new-build parking/BCR stats.
 */
export function calculatePremiumScores(metrics: ObjectiveMetrics | undefined): PremiumScores {
  if (!metrics) {
    return { eduTimePremium: 0, stressFreeParking: 0, commuteFrictional: 0, megaScaleLiquidity: 0, totalPremiumScore: 0 };
  }

  // ---------------------------------------------------------
  // 1. Edu-Time Premium Score (육아·교육 타임세이브 지수)
  // - School distance penalty: base 100, -1 point per 15m (1500m = 0점)
  // - Academy density: max 100 points at 100 academies (radius 1km)
  // - Weight: 50% / 50%
  // ---------------------------------------------------------
  const schoolScore = Math.max(0, 100 - (metrics.distanceToElementary / 15)); 
  const academyScore = Math.min(100, (metrics.academyDensity / 100) * 100);
  const eduTimePremium = (schoolScore * 0.5) + (academyScore * 0.5);

  // ---------------------------------------------------------
  // 2. Stress-Free Parking Index (주차 쾌적성 지표)
  // - Step-function for Parking: >= 1.3 base 50pt, scaling up to 2.0.
  // - Step-function for BCR: <= 15% gets bonus.
  // - Weight: 60% Parking / 40% Build Coverage Ratio
  // ---------------------------------------------------------
  let parkingScore = 0;
  if (metrics.parkingPerHousehold >= 1.3) {
    // 1.3대 이상부터 가점
    parkingScore = 50 + ((metrics.parkingPerHousehold - 1.3) / 0.7) * 50; 
  } else {
    parkingScore = (metrics.parkingPerHousehold / 1.3) * 50;
  }
  parkingScore = Math.min(100, parkingScore);
  
  let bcrScore = 0;
  if (metrics.bcr <= 15) {
    // 15% 이하부터 가점
    bcrScore = 60 + ((15 - metrics.bcr) / 5) * 40; // 10% -> 100점
  } else {
    bcrScore = Math.max(0, 60 - ((metrics.bcr - 15) / 10) * 60); // 25% 이상 감점 심화
  }
  bcrScore = Math.min(100, bcrScore);

  const stressFreeParking = (parkingScore * 0.6) + (bcrScore * 0.4);

  // ---------------------------------------------------------
  // 3. Commute Frictional Cost Inverse (직주근접 마찰비용 역산 지표)
  // - Distance to Subway penalty. Assumes 0m = 100점, 2000m = 0점 (walk limit).
  // ---------------------------------------------------------
  const commuteFrictional = Math.max(0, 100 - (metrics.distanceToSubway / 20));

  // ---------------------------------------------------------
  // 4. Mega-Scale Liquidity Premium (메가-단지 스케일 프리미엄)
  // - Step-up score: 2000+ (100pt), 1000+ (80pt~), 500+ (50pt~)
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
  // 5. Total Premium Score (Data Correlation Control / Multicollinearity)
  // - Challenge: Mega-scale (householdCount) strongly correlates with high parking & low BCR in new towns.
  // - Control mechanism: Dampen the 'MegaScale' and 'StressFree' weights in the Total Score 
  //   so that 'Commute' and 'Edu' (independent variables) retain strong differentiating power.
  // ---------------------------------------------------------
  const totalPremiumScore = 
    (eduTimePremium * 0.35) +       // High independent weight
    (commuteFrictional * 0.35) +    // High independent weight
    (stressFreeParking * 0.20) +    // Dampened due to partial collinearity with Scale
    (megaScaleLiquidity * 0.10);    // Highly dampened

  return {
    eduTimePremium: Math.round(eduTimePremium),
    stressFreeParking: Math.round(stressFreeParking),
    commuteFrictional: Math.round(commuteFrictional),
    megaScaleLiquidity: Math.round(megaScaleLiquidity),
    totalPremiumScore: Math.round(totalPremiumScore)
  };
}
