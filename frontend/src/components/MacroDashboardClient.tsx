'use client';

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';
import type { DongApartment } from '@/lib/dong-apartments';
import type { AptTxSummary } from '@/lib/transaction-summary';
import { DONGTAN_MACRO_TREND } from '@/lib/transaction-summary';
import { normalizeAptName, findTxKey } from '@/lib/utils/apartmentMapping';
import FloatingUserBar from '@/components/FloatingUserBar';
import { ArrowUp } from 'lucide-react';

interface MacroDashboardProps {
  sheetApartments: Record<string, DongApartment[]>;
  txSummaryData: Record<string, AptTxSummary>;
  publicRentalSet: Set<string>;
  userFavorites?: Set<string>;
}

const COLORS = ['#3182f6', '#4196f7', '#00a261', '#f9a825', '#f04452', '#b0b8c1'];
const LINE_COLORS = ['#b0b8c1', '#3182f6', '#f04452', '#00a261', '#f9a825'];

const InfoBox = ({ title, value, unit, progress, badge, color = "#3182f6" }: any) => {
  return (
    <div className="bg-[#f4f5f6] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-[#e5e8eb] overflow-hidden">
      <div className="flex flex-col truncate pr-2">
        <span className="text-[10px] font-bold text-[#8b95a1] mb-1 tracking-widest truncate">{title}</span>
        <div className="flex items-baseline gap-1 truncate">
          <span className="text-[18px] md:text-[20px] font-extrabold text-[#191f28] truncate">{value}</span>
          {unit && <span className="text-[13px] font-bold text-[#4e5968] shrink-0">{unit}</span>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="32" height="32" viewBox="0 0 32 32" className="transform -rotate-90">
            <circle cx="16" cy="16" r="12" fill="transparent" stroke="#e5e8eb" strokeWidth="4" />
            <circle cx="16" cy="16" r="12" fill="transparent" stroke={color} strokeWidth="4"
              strokeDasharray={2 * Math.PI * 12}
              strokeDashoffset={(2 * Math.PI * 12) * (1 - progress / 100)}
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
        </div>
      )}
      {badge && (
        <div className="bg-white border border-[#e5e8eb] px-2.5 py-1.5 rounded-lg shadow-sm shrink-0">
          <span className="text-[13px] font-extrabold text-[#3182f6]">{badge}</span>
        </div>
      )}
    </div>
  );
};

export default function MacroDashboardClient({ sheetApartments, txSummaryData, publicRentalSet, userFavorites }: MacroDashboardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'price' | 'pyeong'>('price');
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Donut Chart Data (실거래가/평단가 티어별 세대수 분포)
  const donutData = useMemo(() => {
    const priceTiers = [
      { name: '15억원 이상', min: 150000, max: Infinity, count: 0 },
      { name: '12억~15억원', min: 120000, max: 150000, count: 0 },
      { name: '10억~12억원', min: 100000, max: 120000, count: 0 },
      { name: '8억~10억원', min: 80000, max: 100000, count: 0 },
      { name: '6억~8억원', min: 60000, max: 80000, count: 0 },
      { name: '6억원 미만', min: 0, max: 60000, count: 0 }
    ];

    const pyeongTiers = [
      { name: '4,000만원 이상', min: 4000, max: Infinity, count: 0 },
      { name: '3,500~4,000만원', min: 3500, max: 4000, count: 0 },
      { name: '3,000~3,500만원', min: 3000, max: 3500, count: 0 },
      { name: '2,500~3,000만원', min: 2500, max: 3000, count: 0 },
      { name: '2,000~2,500만원', min: 2000, max: 2500, count: 0 },
      { name: '2,000만원 미만', min: 0, max: 2000, count: 0 }
    ];

    const tiers = chartMode === 'price' ? priceTiers : pyeongTiers;
    
    Object.entries(sheetApartments).forEach(([dong, apts]) => {
      const validApts = apts.filter(a => !publicRentalSet.has(a.name));

      validApts.forEach(a => {
        const rawTxKey = (a as any).txKey || findTxKey(a.name, txSummaryData);
        const key = rawTxKey ? normalizeAptName(rawTxKey) : null;
        const tx = key ? txSummaryData[key] : undefined;
        if (tx && a.householdCount) {
          let valueToCompare = 0;
          if (chartMode === 'price' && tx.latestPrice) {
            valueToCompare = tx.latestPrice; // 만원 단위
          } else if (chartMode === 'pyeong') {
            valueToCompare = tx.avg3MPerPyeong || tx.avg1MPerPyeong || (tx.latestArea ? tx.latestPrice / (tx.latestArea / 3.3058) : 0);
          }
          
          if (valueToCompare > 0) {
            const tier = tiers.find(t => valueToCompare >= t.min && valueToCompare < t.max);
            if (tier) {
              tier.count += a.householdCount;
            }
          }
        }
      });
    });

    return tiers.map(t => ({
      name: t.name,
      value: t.count,
    }));
  }, [sheetApartments, publicRentalSet, txSummaryData, chartMode]);

  const totalHouseholds = useMemo(() => {
    return donutData.reduce((sum, item) => sum + item.value, 0);
  }, [donutData]);

  // 2. Line Chart Data (동탄 아파트 전체 가격 변화 추이 - 실제 데이터)
  const benchmarks = useMemo(() => {
    return ['동탄 아파트 전체'];
  }, []);

  const lineData = useMemo(() => {
    // DONGTAN_MACRO_TREND (6개월치 월별 평균가 데이터)를 바로 사용
    // 데이터 형식: [{ name: '11월', '동탄 아파트 전체': 5.3 }, ...]
    // fallback으로 DONGTAN_MACRO_TREND가 없을 경우를 대비해 빈 배열 제공
    return DONGTAN_MACRO_TREND || [];
  }, []);

  const topTierRatio = totalHouseholds > 0 
    ? (((donutData[0]?.value || 0) + (donutData[1]?.value || 0)) / totalHouseholds * 100)
    : 0;
  const topTierLabel = chartMode === 'price' ? 'PREMIUM (1급지+)' : 'NEW APT (10년내)';

  const publicRentalRatio = totalHouseholds > 0 
    ? ((donutData[donutData.length - 1]?.value || 0) / totalHouseholds * 100)
    : 0;

  const latestAvgPrice = lineData.length > 0 ? lineData[lineData.length - 1]['동탄 아파트 전체'] : 0;
  const avgPriceProgress = Math.min((latestAvgPrice / 15) * 100, 100); 

  const [maxAptName, maxPriceEok] = useMemo(() => {
    let maxPrice = 0;
    let maxEok = '';
    let maxName = '';
    Object.entries(txSummaryData).forEach(([name, tx]) => {
      if (tx && tx.latestPrice > maxPrice) {
        maxPrice = tx.latestPrice;
        maxEok = tx.latestPriceEok;
        maxName = name;
      }
    });
    if (maxName.length > 7) {
      maxName = maxName.slice(0, 7) + '..';
    }
    return [maxName, maxEok];
  }, [txSummaryData]);

  const formatEok = (val: number) => `${val}억`;

  return (
    <div className="w-full flex flex-col bg-surface relative">
      <div className="flex flex-col md:px-10 lg:px-16 py-0 md:py-6 lg:py-8 w-full">
        {/* Compact Dynamic Sticky Header (Mobile Only) */}
        <div 
          className={`fixed top-0 left-0 right-0 md:hidden z-30 bg-white/95 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'translate-y-0 opacity-100 shadow-sm' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <h1 className="text-[16px] font-extrabold text-[#191f28] tracking-tight">
            동탄 아파트 가치 분석
          </h1>
          <div className="flex items-center gap-3">
            <FloatingUserBar />
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-1 -mr-1 rounded-full hover:bg-body transition-colors"
            >
              <ArrowUp className="w-5 h-5 text-tertiary" />
            </button>
          </div>
        </div>

        {/* Top Header - Main Title */}
        <div className="flex flex-col md:mb-8 px-4 sm:px-6 md:px-2 py-3 md:py-0 relative md:static md:bg-transparent border-b border-border md:border-none">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden flex items-center justify-end">
            <FloatingUserBar />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex w-12 h-12 rounded-xl bg-white border border-[#e5e8eb] items-center justify-center shadow-sm shrink-0">
              <img src="/d-view-icon.png" alt="Icon" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[20px] md:text-[32px] font-extrabold text-[#191f28] tracking-tight leading-none mb-1 md:mb-0">
                동탄 아파트 가치 분석
              </h1>
              <div className="flex items-center gap-1.5 md:mt-5">
                <div className="w-[1.5px] md:w-[3px] h-[10px] md:h-[14px] bg-[#3182f6] rounded-full" />
                <p className="text-[12px] md:text-[15px] font-semibold text-[#4e5968] tracking-tight truncate max-w-[200px] md:max-w-none">
                  DATA LAB — <span className="font-normal text-[#8b95a1] hidden md:inline">통합 부동산 가치 평가 솔루션, 100% 데이터 기반 실시간 분석</span>
                </p>
              </div>
            </div>
          </div>
        </div>

      <div className="flex flex-col md:flex-row gap-4 w-full px-3 sm:px-6 md:px-0 mt-4 md:mt-0">
        {/* Left Column Container */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          {/* Donut Chart Card */}
          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-[#e5e8eb] p-5 min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[18px] font-extrabold text-[#191f28] tracking-tight">
            아파트 {chartMode === 'price' ? '실거래가' : '평단가'} 분포도
          </h2>
          {/* Toss Style Segmented Control */}
          <div className="flex bg-[#f2f4f6] p-1 rounded-lg">
            <button
              onClick={() => setChartMode('price')}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                chartMode === 'price' 
                  ? 'bg-white text-[#191f28] shadow-sm' 
                  : 'text-[#8b95a1] hover:text-[#4e5968]'
              }`}
            >
              매매가
            </button>
            <button
              onClick={() => setChartMode('pyeong')}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                chartMode === 'pyeong' 
                  ? 'bg-white text-[#191f28] shadow-sm' 
                  : 'text-[#8b95a1] hover:text-[#4e5968]'
              }`}
            >
              평당가
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col xl:flex-row items-center justify-between px-2 xl:px-12 gap-6 relative mt-3">
          <div className="w-[240px] h-[240px] relative shrink-0">
            {/* Center Label (Placed before ResponsiveContainer to prevent z-index overlap with Tooltip) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-[13px] font-bold text-[#8b95a1] mb-1">분석 세대수</span>
              <span className="text-[26px] font-extrabold text-[#191f28] leading-none tracking-tight">
                {totalHouseholds.toLocaleString()}
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} className="relative z-10">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={78}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  stroke="none"
                  animationDuration={400}
                  animationBegin={0}
                >
                  {donutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      style={{
                        transition: 'all 0.3s ease',
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                        filter: activeIndex === index ? 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))' : 'none'
                      }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} 세대`, '세대수']}
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontWeight: 'bold', padding: '12px 18px', fontSize: '15px' }}
                  cursor={{ fill: 'transparent' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend */}
          <div className="flex flex-col gap-1 w-full max-w-[260px]">
            {donutData.map((entry, index) => {
              const totalValue = donutData.reduce((s, i) => s + i.value, 0);
              const percentage = totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(1) : '0.0';
              const isActive = activeIndex === index;
              return (
                <div 
                  key={entry.name}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-[#f2f4f6] scale-[1.02]' : 'hover:bg-[#f9fafb]'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[13px] font-bold text-[#4e5968] tracking-tight">{entry.name}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[14px] font-extrabold text-[#191f28] leading-none mb-1">{percentage}%</span>
                    <span className="text-[11px] font-semibold text-[#8b95a1] leading-none">{entry.value.toLocaleString()} 세대</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Info Boxes Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBox title="TOP APARTMENT" value={maxPriceEok} badge={maxAptName} />
          <InfoBox title={topTierLabel} value={topTierRatio.toFixed(1)} unit="%" progress={topTierRatio} color="#3182f6" />
          <InfoBox title="AVG PRICE" value={latestAvgPrice.toFixed(1)} unit="억" progress={avgPriceProgress} color="#f04452" />
          <InfoBox title="PUBLIC RENTAL" value={publicRentalRatio.toFixed(1)} unit="%" progress={publicRentalRatio} color="#b0b8c1" />
        </div>
      </div>

      {/* Right Panel: Line Chart */}
      <div className="w-full md:w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-[#e5e8eb] p-5 min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h2 className="text-[18px] font-extrabold text-[#191f28] tracking-tight">동탄 아파트 전체 가격 변화 추이</h2>
            <span className="text-[13px] text-[#8b95a1] font-medium mt-1">최근 6개월 평균 실거래가 변동 (억 원)</span>
          </div>
          <span className="px-2 py-1 bg-[#f2f4f6] text-[#4e5968] text-[11px] font-bold rounded-md tracking-wider">6M</span>
        </div>

        <div className="flex-1 w-full h-[230px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b95a1', fontSize: 12, fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b95a1', fontSize: 12, fontWeight: 600 }}
                tickFormatter={formatEok}
                domain={['auto', 'auto']}
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '12px 18px', fontWeight: 'bold', fontSize: '14px' }}
                formatter={(value: any) => [`${value || 0}억`, '평균가']}
                labelStyle={{ color: '#8b95a1', marginBottom: '6px', fontSize: '13px' }}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold', color: '#4e5968' }} 
              />
              {benchmarks.map((aptName, idx) => (
                <Line 
                  key={aptName} 
                  type="monotone" 
                  dataKey={aptName} 
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      </div>
      </div>
    </div>
  );
}
