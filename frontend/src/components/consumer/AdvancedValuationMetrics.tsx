'use client';

import React, { useMemo, useState } from 'react';
import { Target, Calculator, Building, MapPin, TrendingUp, Info, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import type { FieldReportData } from '@/lib/DashboardFacade';

interface Props {
  report: FieldReportData;
  transactions: any[];
}

/** 
 * Utility Score (입지/상품성 지수) 산출 알고리즘
 * 100점 만점 
 */
function calculateUtilityScore(report: FieldReportData) {
  let score = 0;
  const breakDown = { specs: 0, infra: 0 };
  const logs: any[] = [];
  
  // 1. 단지 스펙 (Max 40점)
  let scaleScore = 5, parkScore = 0, yearScore = 3;
  let scaleLabel = '500세대 미만', parkLabel = '1.1대 미만', yearLabel = '20년차 초과';

  if (report.sections?.specs) {
    const s = report.sections.specs;
    // 세대수 파싱
    const scaleMatch = s.scale?.match(/\d+(,\d+)?/);
    if (scaleMatch) {
      const hh = parseInt(scaleMatch[0].replace(/,/g, ''));
      if (hh >= 1000) { scaleScore = 15; scaleLabel = '1,000세대 이상 대단지'; }
      else if (hh >= 500) { scaleScore = 10; scaleLabel = '500세대 이상 중형단지'; }
      else { scaleScore = 5; scaleLabel = '500세대 미만 단지'; }
    }
    // 주차대수 파싱
    const parkMatch = s.parkingRatio?.match(/(\d+\.\d+)/);
    if (parkMatch) {
      const p = parseFloat(parkMatch[1]);
      if (p >= 1.5) { parkScore = 15; parkLabel = '1.5대 이상 (여유)'; }
      else if (p >= 1.3) { parkScore = 10; parkLabel = '1.3대 이상 (보통)'; }
      else if (p >= 1.1) { parkScore = 5; parkLabel = '1.1대 이상'; }
      else { parkScore = 0; parkLabel = '1.1대 미만 (혼잡)'; }
    }
    // 연식 파싱
    const yearMatch = s.builtYear?.match(/(\d+)년차/);
    const yr = yearMatch ? parseInt(yearMatch[1]) : 15;
    if (yr <= 5) { yearScore = 10; yearLabel = '5년차 이내 신축'; }
    else if (yr <= 10) { yearScore = 7; yearLabel = '10년차 이내 준신축'; }
    else if (yr <= 20) { yearScore = 3; yearLabel = '20년차 이내'; }
    else { yearScore = 0; yearLabel = '20년차 초과 구축'; }
  } else {
    // Fallback if specs missing
    scaleScore = 10; parkScore = 5; yearScore = 5; 
    scaleLabel = '데이터 없음'; parkLabel = '데이터 없음'; yearLabel = '데이터 없음';
  }
  
  breakDown.specs = scaleScore + parkScore + yearScore;
  logs.push({ category: '단지 규모 (세대수)', score: scaleScore, max: 15, label: scaleLabel, isInfra: false });
  logs.push({ category: '주차 편의성 (세대당)', score: parkScore, max: 15, label: parkLabel, isInfra: false });
  logs.push({ category: '건축 연식', score: yearScore, max: 10, label: yearLabel, isInfra: false });

  // 2. 외부 인프라 (Max 60점, Admin Metrics 최우선)
  let subScore = 5, schScore = 3, storeScore = 4, parkDistScore = 5;
  let subLabel = '1km 초과', schLabel = '800m 초과', storeLabel = '상권 빈약', parkDistLabel = '500m 초과';

  if (report.metrics) {
    const m = report.metrics as any; // Allow relaxed typing for legacy fields
    
    // 교통 (역 거리)
    if (m.distanceToSubway <= 500) { subScore = 20; subLabel = '500m 이내 초역세권'; }
    else if (m.distanceToSubway <= 1000) { subScore = 12; subLabel = '1km 이내 도보권'; }
    else { subScore = 5; subLabel = '1km 초과'; }
    
    // 학군 (학교 거리 - 초/중/고 중 최소거리)
    const minSchool = Math.min(m.distanceToElementary || 9999, m.distanceToMiddle || 9999, m.distanceToHigh || 9999);
    if (minSchool <= 300) { schScore = 15; schLabel = '300m 이내 안심학군'; }
    else if (minSchool <= 800) { schScore = 8; schLabel = '800m 이내 통학권'; }
    else { schScore = 3; schLabel = '800m 초과 제한적 접근'; }
    
    // 상권 (프랜차이즈 수 등) - 편의상 15점 기반
    const stores = (m.academyDensity || 0) + (m.restaurantDensity || 0);
    if (stores >= 50) { storeScore = 15; storeLabel = '50점포 이상 대형상권'; }
    else if (stores >= 20) { storeScore = 8; storeLabel = '20점포 이상 근린상권'; }
    else if (stores > 0) { storeScore = 4; storeLabel = '기본 상권 존재'; }
    else { storeScore = 0; storeLabel = '상권 정보 없음'; }
    
    // 자연 (공원/호수)
    if (m.distanceToPark && m.distanceToPark <= 500) { parkDistScore = 10; parkDistLabel = '500m 이내 공세권'; }
    else { parkDistScore = 5; parkDistLabel = '500m 초과 제한적 뷰'; }
  } else {
    // If no exact metrics, use heuristic from premiumScores or default rating
    subScore = 10; schScore = 15; storeScore = 5; parkDistScore = 5;
    subLabel = '정보 없음'; schLabel = '정보 없음'; storeLabel = '정보 없음'; parkDistLabel = '정보 없음';
  }
  
  breakDown.infra = subScore + schScore + storeScore + parkDistScore;
  logs.push({ category: '핵심 대중교통 (신설역 등)', score: subScore, max: 20, label: subLabel, isInfra: true });
  logs.push({ category: '통학 학군 (초/중/고 최소)', score: schScore, max: 15, label: schLabel, isInfra: true });
  logs.push({ category: '거점 상권 (학원 및 상점)', score: storeScore, max: 15, label: storeLabel, isInfra: true });
  logs.push({ category: '자연 환경 (호수/대형공원)', score: parkDistScore, max: 10, label: parkDistLabel, isInfra: true });

  const rawScore = breakDown.specs + breakDown.infra;
  score = Math.min(100, Math.max(55, rawScore));
  const isCapped = rawScore < 55;
  
  return { total: score, breakDown, logs, rawScore, isCapped };
}

export default function AdvancedValuationMetrics({ report, transactions }: Props) {
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  // 1. Transaction 로직 분리 (매매 vs 전세)
  const sales = useMemo(() => transactions.filter(t => t.dealType === '매매' || !t.dealType), [transactions]);
  const rents = useMemo(() => transactions.filter(t => t.dealType === '전세'), [transactions]);

  // 최근 시세 추출
  const latestSale = sales.length > 0 ? sales[0].price : 0;
  const latestRent = rents.length > 0 ? rents[0].deposit || rents[0].price : 0;
  
  // 2. Utility Score 산출
  const scoreData = useMemo(() => calculateUtilityScore(report), [report]);
  const utilityScore = scoreData.total;

  // 3. Valuation 지표
  const puRatio = latestSale > 0 ? Math.round(latestSale / utilityScore) : 0;
  const jeonseRatio = (latestSale > 0 && latestRent > 0) ? (latestRent / latestSale) * 100 : 0;
  const realEstatePER = (latestSale > 0 && latestRent > 0) ? (latestSale / latestRent).toFixed(2) : 'N/A';

  // 점수대비 가격 차트용 비교군 (동탄 평균 가정)
  const chartData = [
    { name: '본 단지', puRatio: puRatio, color: '#3182f6' },
    { name: '동탄 평균 (가정)', puRatio: 1350, color: '#e5e8eb' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2">
          <Target size={22} className="text-[#3182f6]" />
          AI 상대가치 평가 (Valuation)
        </h2>
        <p className="text-[13px] text-[#8b95a1] ml-7">
          단지 스펙과 외부 입지를 수치화한 <strong>상품성(Utility)</strong> 대비 <strong>현재 가격</strong>의 적정성을 분석합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Utility Score Board */}
        <div className="bg-[#f9fafb] border border-[#e5e8eb] p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#4e5968] flex items-center gap-1.5">
                <Building size={16} /> 종합 상품성 지수 (Utility Score)
              </h3>
              <span className="text-[11px] font-bold text-white bg-[#3182f6] px-2 py-1 rounded-md">100점 만점</span>
            </div>
            
            <div className="text-center my-6">
              {utilityScore > 0 ? (
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[48px] font-extrabold text-[#191f28] tracking-tighter">{utilityScore}</span>
                  <span className="text-[20px] font-bold text-[#8b95a1]">점</span>
                </div>
              ) : (
                <span className="text-[20px] text-[#8b95a1]">데이터 부족</span>
              )}
            </div>
            
            {/* Break Down Toggle */}
            <div className="mt-4">
              <button 
                onClick={() => setShowScoreDetail(!showScoreDetail)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-[#e5e8eb] hover:border-[#3182f6]/50 rounded-xl text-[13px] font-bold text-[#4e5968] hover:text-[#3182f6] transition-colors"
              >
                산출 로직 상세 보기
                <ChevronDown size={14} className={`transition-transform duration-200 ${showScoreDetail ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${showScoreDetail ? 'max-h-[800px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white border border-[#f2f4f6] rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
                  {/* 단지 스펙 파트 */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[12px] font-extrabold text-[#191f28] flex items-center justify-between border-b border-[#f2f4f6] pb-1.5">
                      <span>단지 기본 스펙 (Max 40점)</span>
                      <span className="text-[#3182f6]">{scoreData.breakDown.specs}점</span>
                    </h4>
                    <div className="flex flex-col gap-2">
                    {scoreData.logs.filter(l => !l.isInfra).map((log, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[#4e5968]">{log.category}</span>
                          <span className="text-[11px] text-[#8b95a1] leading-tight">{log.label}</span>
                        </div>
                        <span className="text-[13px] font-extrabold text-[#191f28] bg-[#f9fafb] border border-[#f2f4f6] px-2 py-0.5 rounded-md min-w-[50px] text-center">{log.score}<span className="text-[10px] text-[#8b95a1] ml-0.5 font-medium">/ {log.max}</span></span>
                      </div>
                    ))}
                    </div>
                  </div>

                  {/* 입지 인프라 파트 */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[12px] font-extrabold text-[#191f28] flex items-center justify-between border-b border-[#f2f4f6] pb-1.5">
                      <span>외부 입지 인프라 (Max 60점)</span>
                      <span className="text-[#3182f6]">{scoreData.breakDown.infra}점</span>
                    </h4>
                    <div className="flex flex-col gap-2">
                    {scoreData.logs.filter(l => l.isInfra).map((log, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[#4e5968]">{log.category}</span>
                          <span className="text-[11px] text-[#8b95a1] leading-tight">{log.label}</span>
                        </div>
                        <span className="text-[13px] font-extrabold text-[#191f28] bg-[#f9fafb] border border-[#f2f4f6] px-2 py-0.5 rounded-md min-w-[50px] text-center">{log.score}<span className="text-[10px] text-[#8b95a1] ml-0.5 font-medium">/ {log.max}</span></span>
                      </div>
                    ))}
                    </div>
                  </div>

                  {scoreData.isCapped && (
                    <div className="mt-1 bg-amber-50 rounded-lg p-2.5 flex items-start gap-2 border border-amber-100">
                      <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 leading-tight">
                        순수 합산 점수는 <strong>{scoreData.rawScore}점</strong>이나, 동탄 신도시 인프라 하한선 보정 로직에 의해 <strong>최소 55점</strong> 범위로 방어되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: P/U & PER Metrics */}
        <div className="bg-white border border-[#e5e8eb] p-6 rounded-3xl flex flex-col gap-5 shadow-sm shadow-blue-900/5 ring-1 ring-blue-50">
          <div className="flex flex-col gap-2 border-b border-[#f2f4f6] pb-4">
            <h3 className="text-[14px] font-bold text-[#4e5968] flex items-center justify-between">
              <span>P/U 지수 (Price to Utility)</span>
              <span className="text-blue-500 bg-blue-50 text-[10px] px-1.5 py-0.5 rounded">낮을수록 저평가</span>
            </h3>
            <div className="flex items-end justify-between">
              <div>
                {puRatio > 0 ? (
                  <>
                    <span className="text-[28px] font-extrabold text-[#191f28]">{puRatio.toLocaleString()}</span>
                    <span className="text-[13px] font-medium text-[#8b95a1] ml-1">만원 / 1점</span>
                  </>
                ) : (
                  <span className="text-[20px] font-extrabold text-[#8b95a1]">거래 없음</span>
                )}
              </div>
              <div className="h-[40px] w-[80px]">
                {puRatio > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top:0, right:0, left:0, bottom:0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Bar dataKey="puRatio" radius={[2,2,2,2]} barSize={12}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-[14px] font-bold text-[#4e5968] flex items-center justify-between">
              <span>실사용 PER (매매가 / 전세가 배수)</span>
              <span className="text-amber-600 bg-amber-50 text-[10px] px-1.5 py-0.5 rounded">낮을수록 고수익/가치주</span>
            </h3>
            <div className="flex items-end justify-between">
              <div>
                {realEstatePER !== 'N/A' ? (
                  <>
                    <span className="text-[28px] font-extrabold text-[#191f28]">{realEstatePER}</span>
                    <span className="text-[13px] font-medium text-[#8b95a1] ml-1">배</span>
                  </>
                ) : (
                  <span className="text-[20px] font-extrabold text-[#8b95a1]">N/A</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-[12px] text-[#4e5968]">현 전세가율</div>
                <div className="text-[15px] font-bold text-[#191f28]">{jeonseRatio.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alert / Explanation */}
      <div className="bg-[#f8f9fa] rounded-2xl p-4 flex gap-3 mt-2">
        <Info size={18} className="text-[#8b95a1] shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-[#4e5968] leading-relaxed">
          <strong>P/U 지수</strong>는 단지의 모든 인프라/스펙을 100점 만점으로 환산한 뒤, 1점당 지불하는 매매가격을 뜻합니다. 동탄 평균치보다 P/U가 낮다면 입지 대비 저평가일 확률이 높습니다.<br/>
          <strong>PER 배수</strong>는 주식의 기업 이익(E) 대신 실거주 가치(전세보증금)를 대입한 지표입니다. 배수가 낮을수록 투자(매매) 대비 배당(방어력)이 탄탄한 아파트입니다.
        </p>
      </div>

    </div>
  );
}
