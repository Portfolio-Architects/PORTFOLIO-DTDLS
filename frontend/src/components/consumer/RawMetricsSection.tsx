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
    <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm mb-6 mt-8">
      <h2 className="text-[18px] font-bold text-primary flex items-center gap-2 mb-5 border-b border-border pb-3">
        <MapPin size={18} className="text-toss-blue"/> 실시간 입지 인프라 검증 현황
      </h2>
      
      <div className="space-y-6">
        
        {/* 학교 및 학원 */}
        <div>
          <h3 className="text-[14px] font-bold text-primary mb-3 flex items-center gap-1.5"><GraduationCap size={16} className="text-toss-green"/> 학군 (학교 및 핵심 학원가 반경 500m)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '초등학교', dist: metrics.distanceToElementary, name: metrics.nearestSchoolNames?.elementary },
              { label: '중학교', dist: metrics.distanceToMiddle, name: metrics.nearestSchoolNames?.middle },
              { label: '고등학교', dist: metrics.distanceToHigh, name: metrics.nearestSchoolNames?.high },
            ].map(s => {
              if (s.dist == null || s.dist <= 0) return null;
              return (
                <div key={s.label} className="bg-body border border-border rounded-xl p-3 flex flex-col justify-center">
                  <div className="text-[12px] font-bold text-tertiary mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                    <span className="text-[16px] font-extrabold text-primary">{s.dist}<span className="text-[11px] font-normal text-tertiary ml-0.5">m</span></span>
                    <span className="text-[10px] font-medium text-secondary ml-1 mt-auto bg-body px-1.5 py-0.5 rounded-md mb-0.5">도보 {Math.ceil(s.dist / 80)}분</span>
                  </div>
                  {s.name && <div className="text-[11px] text-secondary mt-0.5 truncate">{s.name}</div>}
                </div>
              )
            })}
            
            {metrics.academyDensity != null && metrics.academyDensity > 0 && (
              <div className="bg-body border border-border rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[12px] font-bold text-tertiary mb-1 flex items-center justify-between">
                  <span>학원가 밀집도</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-toss-green"></span>
                </div>
                <div className="text-[16px] font-extrabold text-primary">{metrics.academyDensity}<span className="text-[11px] font-normal text-tertiary ml-0.5">개</span></div>
                {metrics.academyCategories && (
                  <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1">
                    {Object.entries(metrics.academyCategories).sort(([,a], [,b]) => b - a).slice(0, 3).map(([cat, cnt]) => (
                      <span key={cat} className="text-[10px] bg-surface text-secondary px-1.5 py-0.5 border border-border rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">{cat.substring(0,3)} {cnt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 교통망 */}
        <div>
          <h3 className="text-[14px] font-bold text-primary mb-3 flex items-center gap-1.5"><Train size={16} className="text-toss-blue"/> 광역 및 직주근접 주요 철도망</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: '동탄역 (GTX-A / SRT)', dist: metrics.distanceToSubway, name: metrics.nearestStationName },
              { label: '동탄인덕원선 (예정)', dist: metrics.distanceToIndeokwon },
              { label: '동탄 도시철도 (트램)', dist: metrics.distanceToTram },
            ].map(t => {
              if (t.dist == null || t.dist <= 0) return null;
              return (
                <div key={t.label} className="bg-body border border-border rounded-xl p-3 flex flex-col justify-center">
                  <div className="text-[12px] font-bold text-tertiary mb-1 leading-tight flex items-center justify-between">
                    <span>{t.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-toss-blue" />
                  </div>
                  <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                    <span className="text-[18px] font-extrabold text-primary">{t.dist}<span className="text-[11px] font-normal text-tertiary ml-0.5">m</span></span>
                    <span className="text-[10px] font-medium text-secondary ml-1 mt-auto bg-body px-1.5 py-0.5 rounded-md mb-0.5">도보 {Math.ceil(t.dist / 80)}분</span>
                  </div>
                  {t.name && <div className="text-[11px] text-secondary mt-0.5 truncate">{t.name}</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* 생활 편의 슬세권 */}
        <div>
          <h3 className="text-[14px] font-bold text-primary mb-3 flex items-center gap-1.5"><Coffee size={16} className="text-[#f59e0b]"/> 주요 편의상업시설 (슬세권 반경)</h3>
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
                 <div key={c.label} className="bg-body border border-border rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                   <div className="text-[11px] font-bold text-tertiary mb-1">{c.label}</div>
                   <div className="flex items-baseline gap-0.5 whitespace-nowrap mt-0.5">
                     <span className="text-[14px] font-extrabold text-primary">{c.dist}<span className="text-[10px] font-normal text-tertiary ml-0.5">m</span></span>
                     <span className="text-[9px] font-medium text-secondary ml-1 mt-auto bg-body px-1 py-px rounded mb-0.5">{Math.ceil(c.dist / 80)}분</span>
                   </div>
                 </div>
               )
            })}
            
            {/* 상권 밀집도 */}
            {metrics.restaurantDensity != null && metrics.restaurantDensity > 0 && (
              <div className="bg-body border border-border rounded-xl p-2.5 flex flex-col justify-center text-center">
                <div className="text-[11px] font-bold text-tertiary mb-1">상가/카페 밀집도</div>
                <div className="text-[14px] font-extrabold text-primary">{metrics.restaurantDensity}<span className="text-[10px] font-normal text-tertiary ml-0.5">개</span></div>
              </div>
            )}
            
          </div>
        </div>

      </div>

    </div>
  );
}
