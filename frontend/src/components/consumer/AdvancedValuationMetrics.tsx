'use client';

import React, { useMemo, useState } from 'react';
import { Target, Building, Info, ChevronDown, Users, Car, Calendar, Train, GraduationCap, Store, TreePine, Award, ShieldCheck, TrendingUp } from 'lucide-react';
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
  // 1. Transaction 분리  // 2. Fetch the latest Sale and Jeonse from props
  // Any dealType that is not 전세 or 월세 is considered a Sale (e.g. 중개거래, 직거래)
  const sales = transactions.filter(t => t.dealType !== '전세' && t.dealType !== '월세').sort((a,b) => b.contractDate.localeCompare(a.contractDate));
  const rents = transactions.filter(t => t.dealType === '전세' || t.dealType === '월세').sort((a,b) => b.contractDate.localeCompare(a.contractDate));
  
  const latestSale = sales.length > 0 ? sales[0].price : 0;
  
  // For rent, we convert Wolse to Jeonse equiv (deposit + rent * 12 / 0.055)
  const latestRentTx = rents.length > 0 ? rents[0] : null;
  const latestRent = latestRentTx 
    ? (latestRentTx.dealType === '월세' 
        ? (latestRentTx.deposit || 0) + Math.round((latestRentTx.monthlyRent || 0) * 12 / 0.055) 
        : (latestRentTx.deposit || latestRentTx.price)) 
    : 0;

  // 2. 실사용 PER 계산
  const realEstatePER = (latestSale > 0 && latestRent > 0) ? (latestSale / latestRent) : 0;
  const jeonseRatio = (latestSale > 0 && latestRent > 0) ? (latestRent / latestSale) * 100 : 0;

  // 3. 상태 평가 로직
  let statusText = '데이터 부족';
  let statusColor = 'text-[#8b95a1]';
  let statusBg = 'bg-[#f2f4f6]';
  let StatusIcon = Info;
  let descriptionText = '최근 매매/전세 실거래가 데이터가 부족하여 분석할 수 없습니다.';

  if (realEstatePER > 0) {
    if (realEstatePER < 1.6) {
      statusText = '강력한 하방 경직성 (안전마진 확보)';
      statusColor = 'text-[#03c75a]';
      statusBg = 'bg-[#03c75a]/10 border-[#03c75a]/20';
      StatusIcon = ShieldCheck;
      descriptionText = '사용 가치(전세금) 기반의 자본환원율이 높습니다. 하락장에서도 하방 방어력이 우수하며 투자가치가 돋보입니다.';
    } else if (realEstatePER <= 2.0) {
      statusText = '적정 수준의 프리미엄 (시장 평균)';
      statusColor = 'text-[#3182f6]';
      statusBg = 'bg-[#3182f6]/10 border-[#3182f6]/20';
      StatusIcon = Target;
      descriptionText = '실거주 가치에 적정 수준의 미래 가치 프리미엄이 반영되어 있는 현재 시장의 보편적 형태입니다.';
    } else {
      statusText = '고평가 / 미래 기대감 과다 반영';
      statusColor = 'text-[#f04452]';
      statusBg = 'bg-[#f04452]/10 border-[#f04452]/20';
      StatusIcon = TrendingUp; // Using TrendingUp for "Premium"
      descriptionText = '사용 가치 대비 매매가가 매우 높게 형성되어 있습니다. 금리 인상 등 유동성 충격 시 가격 변동성이 높습니다.';
    }
  }

  // 가격 포맷 헬퍼
  const formatPrice = (p: number) => {
    if (p === 0) return '정보 없음';
    if (p >= 10000) {
      const eok = Math.floor(p / 10000);
      const man = p % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
    }
    return `${p.toLocaleString()}만`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2">
          <Target size={22} className="text-[#3182f6]" strokeWidth={2.5} />
          밸류에이션 분석
        </h2>
        <p className="text-[13px] text-[#8b95a1] ml-7 leading-relaxed flex items-center gap-2">
          <span className="font-bold text-[#191f28] bg-[#f2f4f6] px-1.5 py-0.5 rounded text-[11px] uppercase tracking-wider">Metric 1</span>
          시장이 인정하는 100% 순수 거주 가치(전세금) 기반의 금융 가치 평가 지표입니다.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Main PER Metric Box */}
        <div className="flex-1 bg-white border border-[#e5e8eb] p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between border-b border-[#f2f4f6] pb-4 mb-4">
            <h3 className="text-[15px] font-extrabold text-[#4e5968] flex items-center gap-1.5">
              실사용 PER <span className="font-medium text-[#8b95a1] text-[13px]">(Price to Jeonse)</span>
            </h3>
            <span className="text-[9px] font-bold text-[#3182f6] bg-[#3182f6]/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              Fundamental Value
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center pt-3 pb-7">
            <div className="text-[12px] font-bold text-[#8b95a1] mb-1">매매가 ÷ 전세가 배수</div>
            {realEstatePER > 0 ? (
              <div className="flex items-end gap-1.5">
                <span className="text-[56px] font-black text-[#191f28] leading-none tracking-tighter">
                  {realEstatePER.toFixed(2)}
                </span>
                <span className="text-[18px] font-extrabold text-[#8b95a1] mb-2">배</span>
              </div>
            ) : (
              <div className="text-[24px] font-bold text-[#b0b8c1] my-4">N/A</div>
            )}
          </div>

          {/* Status Alert inside the box */}
          {realEstatePER > 0 && (
            <div className={`mt-2 p-3.5 rounded-xl border flex gap-3 items-start ${statusBg}`}>
              <StatusIcon size={18} className={`${statusColor} shrink-0 mt-0.5`} />
              <div className="flex flex-col gap-1.5">
                <h4 className={`text-[13px] font-extrabold ${statusColor}`}>{statusText}</h4>
                <p className="text-[11.5px] text-[#4e5968] leading-relaxed font-medium">
                  {descriptionText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Data Components & Description */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[#f9fafb] border border-[#e5e8eb] rounded-2xl p-5 flex flex-col justify-center gap-5 flex-1">
            <h4 className="text-[13px] font-bold text-[#4e5968]">기준 실거래 데이터</h4>
            
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8b95a1] font-medium">최근 매매가 (Price)</span>
                <span className="text-[15px] font-extrabold text-[#191f28]">{formatPrice(latestSale)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8b95a1] font-medium">최근 전세가 (Jeonse)</span>
                <span className="text-[15px] font-extrabold text-[#3182f6]">{formatPrice(latestRent)}</span>
              </div>

              <div className="h-px w-full bg-[#e5e8eb] my-1" />
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8b95a1] font-bold">도출된 전세가율</span>
                <span className="text-[15px] font-extrabold text-[#191f28] bg-white px-2 py-0.5 rounded shadow-sm border border-[#e5e8eb]">
                  {jeonseRatio > 0 ? `${jeonseRatio.toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#f2f4f6]/50 rounded-2xl p-4 flex gap-3 text-[12px] text-[#4e5968] leading-relaxed">
            <Info size={16} className="text-[#8b95a1] shrink-0 mt-0.5" />
            <p>
              <strong>실사용 PER(Price to Jeonse)</strong>은 기관투자자 및 프랍트레이더가 채택하는 <strong>자본환원율(Cap Rate)</strong> 평가 방식의 한국형 대체 지표입니다. 배수가 낮을수록 100% 거주 가치 대비 거품이 적어 하락장에서도 뛰어난 가격 방어력을 보입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
