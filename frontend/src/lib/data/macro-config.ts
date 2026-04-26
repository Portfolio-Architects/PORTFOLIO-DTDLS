import { MacroDataConfig } from '../types/macro.types';

export const MOCK_MACRO_CONFIG: MacroDataConfig = {
  macroEnvironment: {
    riskFreeRate: 3.25, // 국고채 3년물 (예시)
    fundingCost: 4.10,  // 시중은행 전세자금대출 평균금리 (예시)
    baseDate: '2026-04-26',
    jeonseConversionRate: 0.05, // 법정/시장 평균 전월세 전환율 5.0%
    baseInflationRate: 0.02,    // 장기 기대 인플레이션 2.0%
  },
  supplyPipelines: {
    '동탄2신도시': {
      region: '동탄2신도시',
      baseYear: 2026,
      expectedMoveInVolume: 12500, // 26~27년 누적 입주예정
      historicalAvgVolume: 8000,
      populationTrend: '증가',
    },
    '화성시': {
      region: '화성시',
      baseYear: 2026,
      expectedMoveInVolume: 22000,
      historicalAvgVolume: 15000,
      populationTrend: '증가',
    }
  }
};
