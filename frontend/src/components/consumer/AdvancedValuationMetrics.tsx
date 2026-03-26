'use client';

import React, { useMemo, useState } from 'react';
import { Target, Building, Info, ChevronDown, Users, Car, Calendar, Train, GraduationCap, Store, TreePine, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import type { FieldReportData } from '@/lib/DashboardFacade';
import { getBrandMultiplier } from '@/lib/utils/scoring';

interface Props {
  report: FieldReportData;
  transactions: any[];
}

// --------------------------------------------------------------------------
// Helper: Gauge Bar UI
// --------------------------------------------------------------------------
const GaugeBar = ({ score, max }: { score: number, max: number }) => {
  const percent = Math.min(100, Math.max(0, (score / max) * 100));
  
  let colorClassText = 'text-[#f04452]';
  let colorClassBg = 'bg-[#f04452]';
  
  if (percent >= 80) { colorClassText = 'text-[#03c75a]'; colorClassBg = 'bg-[#03c75a]'; }
  else if (percent >= 50) { colorClassText = 'text-[#3182f6]'; colorClassBg = 'bg-[#3182f6]'; }
  else if (percent >= 30) { colorClassText = 'text-[#f59e0b]'; colorClassBg = 'bg-[#f59e0b]'; }

  return (
    <div className="flex flex-col gap-1.5 w-[90px] shrink-0">
      <div className="flex justify-end items-baseline gap-1">
        <span className={`text-[14px] font-extrabold ${colorClassText}`}>{score}</span>
        <span className="text-[10px] text-[#8b95a1] font-medium">/ {max}</span>
      </div>
      <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
        <div className={`h-full ${colorClassBg} rounded-full transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// Utility Score V2 엔진 (Max 100점)
// --------------------------------------------------------------------------
function calculateUtilityScoreV2(report: FieldReportData) {
  let score = 0;
  const breakDown = { specs: 0, infra: 0 };
  const logs: any[] = [];
  
  // 1. 단지 스펙 (Max 40점)
  let scaleScore = 5, parkScore = 0, yearScore = 0, brandScore = 0;
  let scaleLabel = '-', parkLabel = '-', yearLabel = '-', brandLabel = '-';

  if (report.metrics) {
    const m = report.metrics as any;
    
    // 브랜드 파워 (Max 5점) - getBrandMultiplier 사용
    let brandVal = m.brand || report.apartmentName || '';
    const mu = getBrandMultiplier(brandVal);
    // mu: 0.90 ~ 1.15. 1.09 이상이면 1군(5점), 1.05~1.08(3점), 1.02~1.04(1점), 이하 0점
    if (mu >= 1.09) { brandScore = 5; brandLabel = '1군 하이엔드/메이저'; }
    else if (mu >= 1.05) { brandScore = 3; brandLabel = '상위 메이저 브랜드'; }
    else if (mu >= 1.02) { brandScore = 1; brandLabel = '인지도 보유 브랜드'; }
    else { brandScore = 0; brandLabel = '기본 브랜드 / 정보없음'; }

    // 세대수 파싱 (Max 10점)
    if (m.householdCount) {
      const hh = Number(m.householdCount);
      if (hh >= 1500) { scaleScore = 10; scaleLabel = `${hh.toLocaleString()}세대 매머드급`; }
      else if (hh >= 1000) { scaleScore = 8; scaleLabel = `${hh.toLocaleString()}세대 대단지`; }
      else if (hh >= 500) { scaleScore = 5; scaleLabel = `${hh.toLocaleString()}세대 중형단지`; }
      else { scaleScore = 3; scaleLabel = `${hh.toLocaleString()}세대 소형단지`; }
    } else {
      scaleScore = 5; scaleLabel = '세대수 데이터 없음';
    }

    // 주차대수 파싱 (Max 15점)
    if (m.parkingPerHousehold) {
      const p = Number(m.parkingPerHousehold);
      if (p >= 1.6) { parkScore = 15; parkLabel = `${p.toFixed(2)}대 (매우 여유)`; }
      else if (p >= 1.4) { parkScore = 12; parkLabel = `${p.toFixed(2)}대 (여유)`; }
      else if (p >= 1.2) { parkScore = 8; parkLabel = `${p.toFixed(2)}대 (보통)`; }
      else if (p >= 1.0) { parkScore = 4; parkLabel = `${p.toFixed(2)}대 (다소 혼잡)`; }
      else { parkScore = 0; parkLabel = `${p.toFixed(2)}대 (혼잡 스트레스)`; }
    } else {
      parkScore = 5; parkLabel = '주차 데이터 없음';
    }

    // 연식 파싱 (Max 10점 - 선형 감가상각)
    if (m.yearBuilt) {
      const year = parseInt(String(m.yearBuilt).substring(0, 4));
      const age = new Date().getFullYear() - year + 1; // n년차
      // 선형 감가 (10년까지 매년 0.5 감가, 이후 좀더 천천히)
      if (age <= 0) { yearScore = 10; yearLabel = '분양/입주예정'; }
      else if (age <= 15) {
        yearScore = Math.max(0, Math.round(10 - (age * 0.5)));
        yearLabel = `${age}년차 (선형 감가)`;
      } else {
        yearScore = Math.max(0, Math.round(3 - ((age - 15) * 0.2)));
        yearLabel = `${age}년차 구축`;
      }
    } else {
      yearScore = 5; yearLabel = '연식 데이터 없음';
    }
  } else {
    scaleScore = 5; parkScore = 5; yearScore = 5; brandScore = 0;
    scaleLabel = '데이터 없음'; parkLabel = '데이터 없음'; yearLabel = '데이터 없음'; brandLabel = '데이터 없음';
  }
  
  breakDown.specs = scaleScore + parkScore + yearScore + brandScore;
  logs.push({ icon: Award, category: '브랜드 파워', score: brandScore, max: 5, label: brandLabel, isInfra: false });
  logs.push({ icon: Users, category: '단지 규모 (세대수)', score: scaleScore, max: 10, label: scaleLabel, isInfra: false });
  logs.push({ icon: Car, category: '주차 편의성 (세대당)', score: parkScore, max: 15, label: parkLabel, isInfra: false });
  logs.push({ icon: Calendar, category: '건축 연식 (감가)', score: yearScore, max: 10, label: yearLabel, isInfra: false });

  // 2. 외부 인프라 (Max 60점)
  let subScore = 5, schScore = 3, storeScore = 4, parkDistScore = 5;
  let subLabel = '1km 초과', schLabel = '800m 초과', storeLabel = '상권 빈약', parkDistLabel = '500m 초과';

  if (report.metrics) {
    const m = report.metrics as any;
    
    // 교통 (역 거리 - 세분화) (Max 20점)
    if (m.distanceToSubway <= 300) { subScore = 20; subLabel = '300m 이내 (초역세권)'; }
    else if (m.distanceToSubway <= 500) { subScore = 16; subLabel = '500m 이내 (역세권)'; }
    else if (m.distanceToSubway <= 800) { subScore = 10; subLabel = '800m 이내 (도보권)'; }
    else if (m.distanceToSubway <= 1200) { subScore = 5; subLabel = '1.2km 이내 (준역세권)'; }
    else { subScore = 2; subLabel = '1.2km 초과 (대중교통 환승)'; }
    
    // 학군 (학교 거리 - 초/중/고 중 최소거리) (Max 15점)
    const minSchool = Math.min(m.distanceToElementary || 9999, m.distanceToMiddle || 9999, m.distanceToHigh || 9999);
    if (minSchool <= 200) { schScore = 15; schLabel = '200m 이내 (초품아급 안심통학)'; }
    else if (minSchool <= 500) { schScore = 10; schLabel = '500m 이내 (도보 통학권)'; }
    else if (minSchool <= 800) { schScore = 6; schLabel = '800m 이내 (도보 가능)'; }
    else { schScore = 3; schLabel = '800m 초과 (통학 불편)'; }
    
    // 상권 (거점 상권 / 앵커 테넌트 가산) (Max 15점)
    const stores = (m.academyDensity || 0) + (m.restaurantDensity || 0);
    // 스타벅스 혹은 대형마트가 500m 내에 있다면 +3점 앵커 가산점
    const hasAnchor = (m.distanceToStarbucks <= 500) || (m.distanceToSupermarket <= 500);
    if (stores >= 80) { storeScore = 15; storeLabel = '80점포 이상 (광역 상권)'; }
    else if (stores >= 40) { storeScore = hasAnchor ? 12 : 10; storeLabel = `40점포 이상 (대형 상권${hasAnchor ? ' + 앵커테넌트' : ''})`; }
    else if (stores >= 15) { storeScore = hasAnchor ? 8 : 6; storeLabel = `15점포 이상 (근린 상권${hasAnchor ? ' + 앵커테넌트' : ''})`; }
    else if (stores > 0) { storeScore = 3; storeLabel = '기본 상권 존재'; }
    else { storeScore = 0; storeLabel = '상권/학원가 정보 없음'; }
    
    // 자연 (공원/호수) (Max 10점)
    if (m.distanceToPark && m.distanceToPark <= 300) { parkDistScore = 10; parkDistLabel = '300m 이내 공세권/호품아'; }
    else if (m.distanceToPark && m.distanceToPark <= 600) { parkDistScore = 6; parkDistLabel = '600m 이내 쾌적한 도보 접근'; }
    else { parkDistScore = 3; parkDistLabel = '600m 초과 제한적 뷰'; }
  } else {
    subScore = 10; schScore = 15; storeScore = 5; parkDistScore = 5;
    subLabel = '정보 없음'; schLabel = '정보 없음'; storeLabel = '정보 없음'; parkDistLabel = '정보 없음';
  }
  
  breakDown.infra = subScore + schScore + storeScore + parkDistScore;
  logs.push({ icon: Train, category: '핵심 궤도교통 역세권', score: subScore, max: 20, label: subLabel, isInfra: true });
  logs.push({ icon: GraduationCap, category: '통학 학군 (초등 중심)', score: schScore, max: 15, label: schLabel, isInfra: true });
  logs.push({ icon: Store, category: '거점 상권/학원/앵커', score: storeScore, max: 15, label: storeLabel, isInfra: true });
  logs.push({ icon: TreePine, category: '자연 환경 (호수/상징공원)', score: parkDistScore, max: 10, label: parkDistLabel, isInfra: true });

  const rawScore = breakDown.specs + breakDown.infra;
  score = Math.min(100, Math.max(55, rawScore));
  const isCapped = rawScore < 55;
  
  return { total: score, breakDown, logs, rawScore, isCapped };
}

export default function AdvancedValuationMetrics({ report, transactions }: Props) {
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  // 1. Transaction 분리 (매매 vs 전세)
  const sales = useMemo(() => transactions.filter(t => t.dealType === '매매' || !t.dealType), [transactions]);
  const rents = useMemo(() => transactions.filter(t => t.dealType === '전세'), [transactions]);

  // 최근 시세 버퍼
  const latestSale = sales.length > 0 ? sales[0].price : 0;
  const latestRent = rents.length > 0 ? rents[0].deposit || rents[0].price : 0;
  
  // 2. Utility Score 산출 (V2)
  const scoreData = useMemo(() => calculateUtilityScoreV2(report), [report]);
  const utilityScore = scoreData.total;

  // 3. Valuation 모델 (P/U & PER)
  const puRatio = latestSale > 0 ? Math.round(latestSale / utilityScore) : 0;
  const jeonseRatio = (latestSale > 0 && latestRent > 0) ? (latestRent / latestSale) * 100 : 0;
  const realEstatePER = (latestSale > 0 && latestRent > 0) ? (latestSale / latestRent).toFixed(2) : 'N/A';

  const chartData = [
    { name: '본 단지', puRatio: puRatio, color: '#3182f6' },
    { name: '동탄 평균 (가정)', puRatio: 1350, color: '#e5e8eb' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2">
          <Target size={22} className="text-[#3182f6]" strokeWidth={2.5} />
          AI 상대가치 평가 (Valuation)
        </h2>
        <p className="text-[13px] text-[#8b95a1] ml-7 leading-relaxed">
          단지 스펙과 입지를 수치화한 <strong>상품성(Utility Score)</strong> 대비 <strong>현재 가격</strong>의 적정성을 분석합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Utility Score Board V2 */}
        <div className="bg-[#f9fafb] border border-[#e5e8eb] p-6 rounded-3xl flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#4e5968] flex items-center gap-1.5">
                <Building size={18} className="text-[#3182f6]" /> 종합 상품성 지수 (V2)
              </h3>
              <span className="text-[11px] font-bold text-white bg-gradient-to-r from-[#3182f6] to-[#1b64da] px-2.5 py-1 rounded-md shadow-sm">100점 만점</span>
            </div>
            
            <div className="text-center my-6">
              {utilityScore > 0 ? (
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[52px] font-extrabold text-[#191f28] tracking-tighter drop-shadow-sm">{utilityScore}</span>
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
                className={`w-full flex items-center justify-center gap-1.5 py-3 border rounded-xl text-[13px] font-bold transition-all duration-200 ${
                  showScoreDetail 
                    ? 'bg-[#3182f6]/5 border-[#3182f6]/20 text-[#3182f6]' 
                    : 'bg-white border-[#e5e8eb] hover:bg-[#f2f4f6] text-[#4e5968]'
                }`}
              >
                진단 레포트 상세 보기
                <ChevronDown size={14} className={`transition-transform duration-300 ${showScoreDetail ? 'rotate-180 text-[#3182f6]' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showScoreDetail ? 'max-h-[1200px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white border border-[#f2f4f6] rounded-2xl p-5 flex flex-col gap-6 shadow-sm ring-1 ring-[#f2f4f6]/50">
                  
                  {/* 단지 기본 스펙 */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-[13px] font-extrabold text-[#191f28] flex items-center justify-between border-b-2 border-[#191f28] pb-1.5">
                      <span>단지 펀더멘탈 (Max 40점)</span>
                      <span className="text-[#3182f6]">{scoreData.breakDown.specs}점</span>
                    </h4>
                    <div className="flex flex-col gap-3.5">
                    {scoreData.logs.filter(l => !l.isInfra).map((log, i) => {
                      const IconComponent = log.icon;
                      return (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#f2f4f6] rounded-lg text-[#8b95a1] group-hover:bg-[#3182f6]/10 group-hover:text-[#3182f6] transition-colors">
                            <IconComponent size={15} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12.5px] font-bold text-[#4e5968]">{log.category}</span>
                            <span className="text-[11.5px] text-[#8b95a1] leading-tight font-medium">{log.label}</span>
                          </div>
                        </div>
                        <GaugeBar score={log.score} max={log.max} />
                      </div>
                      )
                    })}
                    </div>
                  </div>

                  {/* 외부 입지 인프라 */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-[13px] font-extrabold text-[#191f28] flex items-center justify-between border-b-2 border-[#191f28] pb-1.5">
                      <span>외부 입지 인프라 (Max 60점)</span>
                      <span className="text-[#3182f6]">{scoreData.breakDown.infra}점</span>
                    </h4>
                    <div className="flex flex-col gap-3.5">
                    {scoreData.logs.filter(l => l.isInfra).map((log, i) => {
                      const IconComponent = log.icon;
                      return (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#f2f4f6] rounded-lg text-[#8b95a1] group-hover:bg-[#3182f6]/10 group-hover:text-[#3182f6] transition-colors">
                            <IconComponent size={15} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12.5px] font-bold text-[#4e5968]">{log.category}</span>
                            <span className="text-[11.5px] text-[#8b95a1] leading-tight font-medium">{log.label}</span>
                          </div>
                        </div>
                        <GaugeBar score={log.score} max={log.max} />
                      </div>
                      )
                    })}
                    </div>
                  </div>

                  {scoreData.isCapped && (
                    <div className="bg-amber-50/80 rounded-xl p-3 flex items-start gap-2.5 border border-amber-100">
                      <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11.5px] text-amber-700 leading-relaxed font-medium">
                        진단 합산 지수는 <strong>{scoreData.rawScore}점</strong>으로 산출되었으나, 동탄 신도시 인프라 하한선 보정(Floor Limit)에 의해 <strong>최소 55점</strong>으로 상향 보정되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: P/U & PER Metrics */}
        <div className="bg-white border border-[#e5e8eb] p-6 rounded-3xl flex flex-col gap-5 shadow-sm shadow-[#3182f6]/5 ring-1 ring-[#3182f6]/5">
          <div className="flex flex-col gap-2 border-b border-[#f2f4f6] pb-4">
            <h3 className="text-[14px] font-bold text-[#4e5968] flex items-center justify-between">
              <span>P/U 지수 (Price to Utility)</span>
              <span className="text-[#3182f6] bg-[#3182f6]/10 font-medium text-[10px] px-2 py-0.5 rounded-full">낮을수록 저평가</span>
            </h3>
            <div className="flex items-end justify-between mt-1">
              <div>
                {puRatio > 0 ? (
                  <>
                    <span className="text-[30px] font-extrabold text-[#191f28] tracking-tight">{puRatio.toLocaleString()}</span>
                    <span className="text-[13px] font-medium text-[#8b95a1] ml-1.5">만원 / 1점</span>
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
                      <Bar dataKey="puRatio" radius={[3,3,3,3]} barSize={14}>
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

          <div className="flex flex-col gap-2 pt-1">
            <h3 className="text-[14px] font-bold text-[#4e5968] flex items-center justify-between">
              <span>실사용 PER (매매가 / 전세가 배수)</span>
              <span className="text-[#f59e0b] bg-[#f59e0b]/10 font-medium text-[10px] px-2 py-0.5 rounded-full">낮을수록 배당 매력</span>
            </h3>
            <div className="flex items-end justify-between mt-1">
              <div>
                {realEstatePER !== 'N/A' ? (
                  <>
                    <span className="text-[30px] font-extrabold text-[#191f28] tracking-tight">{realEstatePER}</span>
                    <span className="text-[13px] font-medium text-[#8b95a1] ml-1.5">배</span>
                  </>
                ) : (
                  <span className="text-[20px] font-extrabold text-[#8b95a1]">N/A</span>
                )}
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[11px] font-medium text-[#8b95a1] uppercase tracking-wider mb-0.5">전세가율</div>
                <div className="text-[15px] font-extrabold text-[#191f28] bg-[#f2f4f6] px-2 py-0.5 rounded">{jeonseRatio.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alert / Explanation */}
      <div className="bg-[#f2f4f6]/50 rounded-2xl p-4 flex gap-3 mt-1 text-[12.5px] text-[#4e5968] leading-relaxed">
        <Info size={18} className="text-[#8b95a1] shrink-0 mt-0.5" />
        <p>
          <strong>P/U 지수</strong>는 단지의 입지·스펙을 100점 만점으로 환산 후 1점당 지불 여력을 뜻합니다. 평균치 대비 점수가 낮으면 저평가입니다.<br/>
          <strong>PER 배수</strong>는 주식의 기업 이익 대신 실거주 가치(전세보증금)를 대입한 지표입니다. 낮을수록 방어력(투자 가치 대비 실사용 가치)이 높습니다.
        </p>
      </div>

    </div>
  );
}
