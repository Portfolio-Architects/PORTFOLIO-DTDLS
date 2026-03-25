import React from 'react';
import { MapPin, Train, Coffee, GraduationCap } from 'lucide-react';

interface RawMetrics {
  brand?: string;
  householdCount?: number;
  yearBuilt?: number | string;
  parkingPerHousehold?: number;
  far?: number;
  bcr?: number;
  distanceToElementary?: number;
  distanceToMiddle?: number;
  distanceToHigh?: number;
  distanceToSubway?: number;
  distanceToIndeokwon?: number;
  distanceToTram?: number;
  distanceToStarbucks?: number;
  distanceToMcDonalds?: number;
  distanceToOliveYoung?: number;
  distanceToDaiso?: number;
  distanceToSupermarket?: number;
  academyDensity?: number;
  academyCategories?: Record<string, number>;
  restaurantDensity?: number;
  restaurantCategories?: Record<string, number>;
  nearestSchoolNames?: { elementary?: string; middle?: string; high?: string; };
  nearestStationName?: string;
}

export default function RawMetricsSection({ metrics }: { metrics: RawMetrics | undefined }) {
  if (!metrics) return null;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-6 mt-8">
      <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
        <MapPin size={18} className="text-[#3182f6]"/> 실시간 입지 인프라 검증 현황
      </h2>
      
      <div className="space-y-6">
        
        {/* 학교 및 학원 */}
        <div>
          <h3 className="text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5"><GraduationCap size={16} className="text-[#03c75a]"/> 학군 (학교 및 핵심 학원가 반경 500m)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '초등학교', dist: metrics.distanceToElementary, name: metrics.nearestSchoolNames?.elementary },
              { label: '중학교', dist: metrics.distanceToMiddle, name: metrics.nearestSchoolNames?.middle },
              { label: '고등학교', dist: metrics.distanceToHigh, name: metrics.nearestSchoolNames?.high },
            ].map(s => {
              if (s.dist == null || s.dist <= 0) return null;
              return (
                <div key={s.label} className="bg-[#f9fafb] border border-[#e5e8eb] rounded-xl p-3 flex flex-col justify-center">
                  <div className="text-[12px] font-bold text-[#8b95a1] mb-1">{s.label}</div>
                  <div className="text-[16px] font-extrabold text-[#191f28]">{s.dist}<span className="text-[11px] font-normal text-[#8b95a1] ml-0.5">m</span></div>
                  {s.name && <div className="text-[11px] text-[#4e5968] mt-0.5 truncate">{s.name}</div>}
                </div>
              )
            })}
            
            {metrics.academyDensity != null && metrics.academyDensity > 0 && (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 flex flex-col">
                <div className="text-[12px] font-bold text-[#03c75a] mb-1">핵심 학원가 밀집도</div>
                <div className="text-[16px] font-extrabold text-[#03c75a]">{metrics.academyDensity}<span className="text-[11px] font-normal text-[#03c75a]/70 ml-0.5">개</span></div>
                {metrics.academyCategories && (
                  <div className="mt-2 pt-2 border-t border-[#bbf7d0] flex flex-wrap gap-1">
                    {Object.entries(metrics.academyCategories).sort(([,a], [,b]) => b - a).slice(0, 3).map(([cat, cnt]) => (
                      <span key={cat} className="text-[10px] bg-white text-[#03c75a] px-1.5 py-0.5 border border-[#bbf7d0] rounded-md">{cat.substring(0,3)} {cnt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 교통망 */}
        <div>
          <h3 className="text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5"><Train size={16} className="text-[#3182f6]"/> 광역 및 직주근접 주요 철도망</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '동탄역 (GTX-A / SRT)', dist: metrics.distanceToSubway, name: metrics.nearestStationName },
              { label: '동탄인덕원선 (예정)', dist: metrics.distanceToIndeokwon },
              { label: '동탄 도시철도 (트램)', dist: metrics.distanceToTram },
            ].map(t => {
              if (t.dist == null || t.dist <= 0) return null;
              return (
                <div key={t.label} className="bg-[#e8f3ff] border border-[#cce5ff] rounded-xl p-3">
                  <div className="text-[12px] font-bold text-[#3182f6] mb-1 leading-tight">{t.label}</div>
                  <div className="text-[18px] font-extrabold text-[#3182f6]">{t.dist}<span className="text-[11px] font-normal text-[#3182f6]/70 ml-0.5">m</span></div>
                  {t.name && <div className="text-[11px] text-[#3182f6]/80 mt-0.5 truncate">{t.name}</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* 생활 편의 슬세권 */}
        <div>
          <h3 className="text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5"><Coffee size={16} className="text-[#f59e0b]"/> 주요 편의상업시설 (슬세권 반경)</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: '대형마트 등', dist: metrics.distanceToSupermarket },
              { label: '스타벅스', dist: metrics.distanceToStarbucks },
              { label: '맥도날드', dist: metrics.distanceToMcDonalds },
              { label: '올리브영', dist: metrics.distanceToOliveYoung },
              { label: '다이소', dist: metrics.distanceToDaiso },
            ].map(c => {
               if (c.dist == null || c.dist <= 0) return null;
               return (
                 <div key={c.label} className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                   <div className="text-[11px] font-bold text-[#d97706] mb-1">{c.label}</div>
                   <div className="text-[14px] font-extrabold text-[#f59e0b]">{c.dist}<span className="text-[10px] font-normal text-[#f59e0b]/70 ml-0.5">m</span></div>
                 </div>
               )
            })}
            
            {/* 상권 밀집도 */}
            {metrics.restaurantDensity != null && metrics.restaurantDensity > 0 && (
              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-2.5 flex flex-col justify-center text-center">
                <div className="text-[11px] font-bold text-[#d97706] mb-1">상가/카페 밀집도</div>
                <div className="text-[14px] font-extrabold text-[#f59e0b]">{metrics.restaurantDensity}<span className="text-[10px] font-normal text-[#f59e0b]/70 ml-0.5">개</span></div>
              </div>
            )}
            
          </div>
        </div>

      </div>

    </div>
  );
}
