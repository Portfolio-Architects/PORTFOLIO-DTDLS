'use client';

import { TrendingUp, Users, FileText, ArrowRight, BookOpen, Radar, RefreshCw, Train, Building, Calendar } from 'lucide-react';
import MainChart from '@/components/MainChart';
import EduBubbleChart from '@/components/EduBubbleChart';
import LifestyleRadarChart from '@/components/LifestyleRadarChart';

export default function Dashboard() {
  return (
    <div className="animate-in fade-in duration-300">
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
        <div className="toss-card flex flex-col justify-between gap-3 bg-gradient-to-br from-[#ffffff] to-[#fff5f5] border border-[#ffebec]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-[#f04452] font-bold flex items-center gap-1.5 mb-1">
                <TrendingUp size={16} /> 금주의 신고가
              </h3>
              <p className="text-[13px] text-[#4e5968]">동탄역 롯데캐슬 84㎡</p>
            </div>
            <div className="bg-[#f04452] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              HOT
            </div>
          </div>
          <div>
            <div className="text-[26px] font-bold tracking-tight text-[#191f28] flex items-baseline gap-1.5">
              16.5<span className="text-[18px] font-semibold text-[#191f28]">억</span>
              <span className="text-[13px] text-[#f04452] font-semibold tracking-normal ml-1">↑ 2.1억</span>
            </div>
            <p className="text-[12px] text-[#8b95a1] mt-0.5">이전 최고가: 14.4억 (24년 10월)</p>
          </div>
        </div>

        <div className="toss-card flex flex-col justify-between gap-3 bg-gradient-to-br from-[#ffffff] to-[#f4f8ff] border border-[#e8f3ff]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-[#3182f6] font-bold flex items-center gap-1.5 mb-1">
                <Users size={16} /> 신혼 추천 아파트
              </h3>
              <p className="text-[13px] text-[#4e5968]">가성비 20평대 · 전세 3억대</p>
            </div>
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-[#191f28] leading-snug">
              1. 반도유보라 아이비파크 2.0<br/>
              2. 금강펜테리움 센트럴파크
            </div>
            <p className="text-[12px] text-[#3182f6] mt-2 font-medium cursor-pointer hover:underline">자세히 보기 →</p>
          </div>
        </div>

        <div className="toss-card flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-[#03c75a] font-bold flex items-center gap-1.5 mb-1">
                <RefreshCw size={16} /> 동탄 시장 온도
              </h3>
              <p className="text-[13px] text-[#4e5968]">주간 아파트 거래량</p>
            </div>
            <div className="bg-[#e8f5e9] text-[#03c75a] text-[11px] font-bold px-2 py-0.5 rounded-full">
              매수자 우위
            </div>
          </div>
          <div>
            <div className="text-[26px] font-bold tracking-tight text-[#191f28] flex items-baseline gap-1.5">
              142<span className="text-[18px] font-semibold text-[#191f28]">건</span>
              <span className="text-[13px] text-[#03c75a] font-semibold tracking-normal ml-1">↑ 12%</span>
            </div>
            <div className="w-full bg-[#f2f4f6] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-[#03c75a] h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart Section */}
        <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[480px] lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">부동산 매매/전월세 거래량 추이</h2>
            <button className="btn-outline">자세히 보기</button>
          </div>
          <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center relative overflow-hidden">
            <MainChart />
          </div>
        </div>

        {/* Edu Bubble Chart */}
        <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[480px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">에듀 랩스: 권역별 학원 밀집도</h2>
            <button className="icon-btn"><BookOpen size={20} /></button>
          </div>
          <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center overflow-hidden">
            <EduBubbleChart />
          </div>
        </div>

        {/* Lifestyle Radar Chart */}
        <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[480px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">라이프스타일: 상권 혼잡도</h2>
            <button className="icon-btn"><Radar size={20} /></button>
          </div>
          <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center overflow-hidden">
            <LifestyleRadarChart />
          </div>
        </div>

        {/* News & Issues Feed */}
        <div className="toss-card flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">실시간 지역 소식</h2>
            <button className="icon-btn"><RefreshCw size={20} /></button>
          </div>
          <ul className="flex flex-col">
            <li className="flex gap-4 items-start py-4 border-b border-[#f2f4f6] hover:bg-[#f9fafb] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 tag-traffic relative -top-1">
                <Train size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] leading-relaxed mb-1 font-semibold text-[#191f28] line-clamp-2 group-hover:text-[#3182f6] transition-colors">동탄트램 1,2호선 기본설계 완료, 년말 착공 목표</h4>
                <span className="text-[13px] text-[#8b95a1]">2시간 전 · 교통</span>
              </div>
            </li>
            <li className="flex gap-4 items-start py-4 border-b border-[#f2f4f6] hover:bg-[#f9fafb] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 tag-realestate relative -top-1">
                <Building size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] leading-relaxed mb-1 font-semibold text-[#191f28] line-clamp-2 group-hover:text-[#3182f6] transition-colors">동탄호수공원 주변 상권 활성화, 신규 브랜드 입점 줄이어</h4>
                <span className="text-[13px] text-[#8b95a1]">5시간 전 · 부동산</span>
              </div>
            </li>
            <li className="flex gap-4 items-start py-4 border-b border-[#f2f4f6] hover:bg-[#f9fafb] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 tag-edu relative -top-1">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] leading-relaxed mb-1 font-semibold text-[#191f28] line-clamp-2 group-hover:text-[#3182f6] transition-colors">동탄2신도시 과밀학급 해소 위해 임시 모듈러 교실 추가 도입</h4>
                <span className="text-[13px] text-[#8b95a1]">1일 전 · 교육</span>
              </div>
            </li>
            <li className="flex gap-4 items-start py-4 border-[#f2f4f6] hover:bg-[#f9fafb] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 tag-culture relative -top-1">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] leading-relaxed mb-1 font-semibold text-[#191f28] line-clamp-2 group-hover:text-[#3182f6] transition-colors">주말 동탄 여울공원 달빛산책 축제 개최 안내</h4>
                <span className="text-[13px] text-[#8b95a1]">1일 전 · 문화</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Horizontal Ad Banner */}
      <div className="relative bg-[#e8f3ff] flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:px-8 md:py-6 rounded-2xl gap-4">
        <p className="absolute top-4 right-6 bg-black/5 text-[#3182f6] text-[10px] py-1 px-1.5 rounded font-bold">AD</p>
        <div>
          <h2 className="text-[20px] font-bold text-[#191f28] mb-1 tracking-tight pr-10">동탄센트럴파크 앞 프리미엄 치과 오픈!</h2>
          <p className="text-[#4e5968] text-[15px]">최첨단 장비와 분야별 전문의 협진. 첫 방문 고객 스케일링 이벤트 중</p>
        </div>
        <button className="btn-primary w-full md:w-auto shrink-0 px-6 rounded-xl">예약하기</button>
      </div>

    </div>
  );
}
