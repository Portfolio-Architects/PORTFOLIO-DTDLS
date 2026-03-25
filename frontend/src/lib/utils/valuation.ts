import type { PremiumScores } from './scoring';
import { getBrandMultiplier } from './scoring';

/**
 * 밸류에이션 상대 가치 지표
 * 
 * PUR (Price-to-Utility Ratio): 가격 대비 효용비
 *   = 84㎡ 기준 가격(만원) / 종합 프리미엄 점수
 *   → 낮을수록 가성비 우수
 *
 * 추정 임대수익률: 
 *   = (연 추정 임대료 / 매매가) * 100
 *   전세가율 기반 시뮬레이션 (실제 임대 데이터 연동 시 교체 예정)
 */

export interface ValuationResult {
  pur: number;           // Price-to-Utility Ratio (낮을수록 가성비)
  purGrade: string;      // S/A/B/C/D
  purColor: string;
  estimatedYield: number; // 추정 임대수익률 (%)
  yieldGrade: string;
  yieldColor: string;
  fairValue84: number;    // μ 보정 적정가 (만원)
  fairValueGap: number;   // (적정가 - 실제가) / 실제가 × 100 (%)
  investmentGrade: string; // S/A/B/C/D 종합 투자 등급
  investmentColor: string;
}

export interface WaterfallItem {
  name: string;
  rawScore: number;
  weight: number;
  contribution: number;  // rawScore * weight
  color: string;
}

export interface ValuationBreakdown {
  items: WaterfallItem[];
  totalScore: number;
  pur: number;
  estimatedYield: number;
}

const AREA_CONFIG = [
  { key: 'education', name: '학군', weight: 0.25, color: '#03c75a' },
  { key: 'transport', name: '교통', weight: 0.25, color: '#3182f6' },
  { key: 'livingComfort', name: '주거쾌적', weight: 0.20, color: '#f59e0b' },
  { key: 'complex', name: '단지경쟁력', weight: 0.15, color: '#8b5cf6' },
  { key: 'lifestyle', name: '생활인프라', weight: 0.15, color: '#ef4444' },
] as const;

/**
 * PUR 등급 산정
 * PUR = 84㎡ 가격(만원) / 종합점수
 * 동탄 기준: 평균 PUR ≈ 80~120
 */
function getPurGrade(pur: number): { grade: string; color: string } {
  if (pur <= 60) return { grade: 'S', color: '#03c75a' };
  if (pur <= 80) return { grade: 'A', color: '#36b37e' };
  if (pur <= 100) return { grade: 'B+', color: '#3182f6' };
  if (pur <= 130) return { grade: 'B', color: '#f59e0b' };
  if (pur <= 160) return { grade: 'C', color: '#ff8b3d' };
  return { grade: 'D', color: '#f04452' };
}

function getYieldGrade(y: number): { grade: string; color: string } {
  if (y >= 5.0) return { grade: 'S', color: '#03c75a' };
  if (y >= 4.0) return { grade: 'A', color: '#36b37e' };
  if (y >= 3.0) return { grade: 'B+', color: '#3182f6' };
  if (y >= 2.0) return { grade: 'B', color: '#f59e0b' };
  if (y >= 1.5) return { grade: 'C', color: '#ff8b3d' };
  return { grade: 'D', color: '#f04452' };
}

/** 동탄 시장 평균 PUR (벤치마크) */
const DONGTAN_AVG_PUR = 95;

/** 종합 투자 등급: PUR·수익률·적정가 괴리율 가중 합산 */
function getInvestmentGrade(purGradeScore: number, yieldScore: number, gapPct: number): { grade: string; color: string } {
  // purGradeScore: S=5,A=4,B+=3,B=2,C=1,D=0 / yieldScore: 동일
  // gapPct: 양수=저평가, 음수=고평가 → 보너스/페널티
  const gapBonus = Math.max(-2, Math.min(2, gapPct / 10)); // ±20% → ±2점
  const composite = (purGradeScore * 0.4) + (yieldScore * 0.3) + (gapBonus + 2.5) * 0.3;
  if (composite >= 4.0) return { grade: 'S', color: '#03c75a' };
  if (composite >= 3.2) return { grade: 'A', color: '#36b37e' };
  if (composite >= 2.4) return { grade: 'B+', color: '#3182f6' };
  if (composite >= 1.6) return { grade: 'B', color: '#f59e0b' };
  if (composite >= 0.8) return { grade: 'C', color: '#ff8b3d' };
  return { grade: 'D', color: '#f04452' };
}

function gradeToScore(grade: string): number {
  const map: Record<string, number> = { 'S': 5, 'A': 4, 'B+': 3, 'B': 2, 'C': 1, 'D': 0 };
  return map[grade] ?? 0;
}

/**
 * PUR 계산
 * @param price84Man 84㎡ 기준 매매가 (만원 단위)
 * @param totalScore 종합 프리미엄 점수 (0~100)
 * @param brandName 브랜드/시공사명 (μ 조회용)
 */
export function calculatePUR(price84Man: number, totalScore: number, brandName?: string): ValuationResult {
  const mu = getBrandMultiplier(brandName);
  const safeTotalScore = Math.max(totalScore, 1);
  const pur = Math.round((price84Man / (safeTotalScore * mu)) * 10) / 10;
  const purInfo = getPurGrade(pur);

  // 추정 임대수익률: 동탄 평균 전세가율 약 55~70%
  // 연 환산: (매매가 - 전세가) → 월세 전환 (전환율 4.5%) → 연수익률
  const jeonseRate = 0.62; // 동탄 평균 전세가율
  const conversionRate = 0.045; // 전월세 전환율
  const monthlyRent = (price84Man * (1 - jeonseRate)) * conversionRate / 12;
  const annualRent = monthlyRent * 12;
  const estimatedYield = Math.round((annualRent / price84Man) * 1000) / 10;
  const yieldInfo = getYieldGrade(estimatedYield);

  // μ 보정 적정가: totalScore × μ × 시장 평균 PUR
  const fairValue84 = Math.round(safeTotalScore * mu * DONGTAN_AVG_PUR);
  const fairValueGap = Math.round(((fairValue84 - price84Man) / Math.max(price84Man, 1)) * 1000) / 10;

  // 종합 투자 등급
  const investmentInfo = getInvestmentGrade(
    gradeToScore(purInfo.grade),
    gradeToScore(yieldInfo.grade),
    fairValueGap,
  );

  return {
    pur,
    purGrade: purInfo.grade,
    purColor: purInfo.color,
    estimatedYield,
    yieldGrade: yieldInfo.grade,
    yieldColor: yieldInfo.color,
    fairValue84,
    fairValueGap,
    investmentGrade: investmentInfo.grade,
    investmentColor: investmentInfo.color,
  };
}

/**
 * 밸류에이션 폭포수 분해
 */
export function getValuationBreakdown(
  scores: PremiumScores,
  price84Man: number,
  customWeights?: Record<string, number>,
  brandName?: string,
): ValuationBreakdown {
  const items: WaterfallItem[] = AREA_CONFIG.map(area => {
    const rawScore = (scores as unknown as Record<string, number>)[area.key] ?? 0;
    const weight = customWeights?.[area.key] ?? area.weight;
    return {
      name: area.name,
      rawScore,
      weight,
      contribution: Math.round(rawScore * weight * 10) / 10,
      color: area.color,
    };
  });

  const totalScore = Math.round(items.reduce((sum, item) => sum + item.contribution, 0));
  const mu = getBrandMultiplier(brandName);
  const safeTotalScore = Math.max(totalScore, 1);
  const pur = Math.round((price84Man / (safeTotalScore * mu)) * 10) / 10;

  const jeonseRate = 0.62;
  const conversionRate = 0.045;
  const monthlyRent = (price84Man * (1 - jeonseRate)) * conversionRate / 12;
  const annualRent = monthlyRent * 12;
  const estimatedYield = Math.round((annualRent / price84Man) * 1000) / 10;

  return { items, totalScore, pur, estimatedYield };
}

/**
 * 84㎡ 기준 가격 추정
 * 거래 면적이 84㎡가 아닌 경우 면적 비율로 정규화
 */
export function normalize84Price(priceMan: number, areaM2: number): number {
  if (areaM2 <= 0) return priceMan;
  const pricePerM2 = priceMan / areaM2;
  return Math.round(pricePerM2 * 84);
}

export { AREA_CONFIG };
