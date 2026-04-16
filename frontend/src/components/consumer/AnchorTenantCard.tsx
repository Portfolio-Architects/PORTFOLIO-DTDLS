'use client';

import { MapPin } from 'lucide-react';

/**
 * AnchorTenantCard — 앵커 테넌트 근접도 시각화 카드
 * 스타벅스, 올리브영, 다이소, 대형마트, 맥도날드까지의 거리를
 * 시각적 바 차트 + 등급 배지로 표시합니다.
 */

interface AnchorTenantCardProps {
  distanceToStarbucks?: number;
  starbucksName?: string;
  starbucksAddress?: string;
  starbucksCoordinates?: string;
  distanceToOliveYoung?: number;
  oliveYoungName?: string;
  oliveYoungAddress?: string;
  oliveYoungCoordinates?: string;
  distanceToDaiso?: number;
  daisoName?: string;
  daisoAddress?: string;
  daisoCoordinates?: string;
  distanceToSupermarket?: number;
  supermarketName?: string;
  supermarketAddress?: string;
  supermarketCoordinates?: string;
  distanceToMcDonalds?: number;
  mcdonaldsName?: string;
  mcdonaldsAddress?: string;
  mcdonaldsCoordinates?: string;
}

interface AnchorItem {
  id: string;
  name: string;
  distance: number | undefined;
  color: string;
  bgColor: string;
  metaName?: string;
  metaAddress?: string;
  metaCoordinates?: string;
}

/** 거리 → 등급 (도보 기준) */
function getGrade(distance: number): { label: string; color: string; bg: string } {
  if (distance <= 300) return { label: '최근접', color: '#03c75a', bg: '#f0fdf4' };
  if (distance <= 500) return { label: '도보 5분', color: '#3182f6', bg: '#e8f3ff' };
  if (distance <= 800) return { label: '도보 10분', color: '#f59e0b', bg: '#fffbeb' };
  return { label: '10분+', color: '#8b95a1', bg: '#f2f4f6' };
}



export default function AnchorTenantCard(props: AnchorTenantCardProps) {
  const anchors: AnchorItem[] = [
    { 
      id: 'starbucks',
      name: '스타벅스', 
      distance: props.distanceToStarbucks, 
      color: '#00704A', 
      bgColor: '#f0fdf4',
      metaName: props.starbucksName,
      metaAddress: props.starbucksAddress,
      metaCoordinates: props.starbucksCoordinates
    },
    { 
      id: 'oliveyoung', 
      name: '올리브영', 
      distance: props.distanceToOliveYoung, 
      color: '#03c75a', 
      bgColor: '#f0fdf4',
      metaName: props.oliveYoungName,
      metaAddress: props.oliveYoungAddress,
      metaCoordinates: props.oliveYoungCoordinates
    },
    { 
      id: 'daiso', 
      name: '다이소', 
      distance: props.distanceToDaiso, 
      color: '#EF4444', 
      bgColor: '#fff0f1',
      metaName: props.daisoName,
      metaAddress: props.daisoAddress,
      metaCoordinates: props.daisoCoordinates
    },
    { 
      id: 'supermarket', 
      name: '대형마트', 
      distance: props.distanceToSupermarket, 
      color: '#f59e0b', 
      bgColor: '#fffbeb',
      metaName: props.supermarketName,
      metaAddress: props.supermarketAddress,
      metaCoordinates: props.supermarketCoordinates
    },
    { 
      id: 'mcdonalds', 
      name: '맥도날드', 
      distance: props.distanceToMcDonalds, 
      color: '#DA291C', 
      bgColor: '#fff0f1',
      metaName: props.mcdonaldsName,
      metaAddress: props.mcdonaldsAddress,
      metaCoordinates: props.mcdonaldsCoordinates
    },
  ];

  const available = anchors.filter(a => a.distance != null);
  if (available.length === 0) return null;

  const TRACK_MAX_DISTANCE = 2000;

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-[#e5e8eb] pb-3">
        <h2 className="text-[16px] md:text-[18px] font-bold text-[#191f28] flex items-center gap-2">
          주요 편의시설 접근성
        </h2>
      </div>

      {/* Anchor List */}
      <div className="flex flex-col">
        {anchors.map((anchor) => {
          if (anchor.distance == null) return null;
          const grade = getGrade(anchor.distance);
          const barWidth = Math.min(100, Math.max(1, (anchor.distance / TRACK_MAX_DISTANCE) * 100));

          return (
            <div key={anchor.id} className="group flex flex-col gap-2.5 py-4 border-b border-[#f2f4f6] last:border-0 relative">
              
              {/* Top Row: Label & Progress Bar */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Category Badge */}
                <div className="w-[72px] md:w-[86px] shrink-0">
                  <div className="flex items-center justify-center w-full px-1 md:px-2 py-1.5 rounded-lg bg-[#f9fafb] border border-[#f2f4f6]">
                    <span className="text-[11px] md:text-[12px] font-bold whitespace-nowrap" style={{ color: anchor.color }}>
                      {anchor.name}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Distance Info */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="flex-1 bg-[#f2f4f6] rounded-full h-[8px] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${barWidth}%`, backgroundColor: grade.color }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <span className="text-[12px] md:text-[13px] font-extrabold text-[#191f28] tabular-nums w-[42px] md:w-[50px] text-right">
                      {(anchor.distance / 1000).toFixed(2)}km
                    </span>
                    <span
                      className="text-[10px] font-bold py-0.5 rounded-md whitespace-nowrap w-[44px] md:w-[52px] text-center"
                      style={{ color: grade.color, backgroundColor: grade.bg }}
                    >
                      {grade.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Detail Card (Aligned with Progress Bar) */}
              {anchor.metaName && (
                <div className="mt-1 md:mt-0 md:ml-[102px]">
                  <div className="flex items-center justify-between gap-3 bg-[#f9fafb]/50 border border-[#f2f4f6] group-hover:bg-white group-hover:border-[#3182f6]/30 group-hover:shadow-[0_2px_12px_rgba(49, 130, 246,0.06)] px-3.5 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden">
                    {/* Brand indicator stick */}
                    <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: anchor.color }} />
                    
                    <div className="flex flex-col min-w-0 flex-1 pl-1.5">
                      <div className="flex items-center gap-1.5 text-[#191f28] font-bold text-[12px] md:text-[13px] truncate">
                        <span className="truncate">{anchor.metaName}</span>
                      </div>
                      {anchor.metaAddress && (
                        <div className="text-[#8b95a1] font-medium text-[11px] truncate mt-0.5">
                          {anchor.metaAddress}
                        </div>
                      )}
                    </div>
                    
                    {anchor.metaCoordinates && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${anchor.metaCoordinates}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#8b95a1] bg-white border border-[#e5e8eb] group-hover:border-transparent group-hover:text-[#3182f6] group-hover:bg-[#e8f3ff] hover:!bg-[#3182f6] hover:!text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <MapPin size={12} strokeWidth={2.5} />
                        <span className="text-[11px] font-extrabold tracking-tight">지도</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — 기준 설명 */}
      <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex flex-wrap items-center justify-between gap-y-2 text-[10px] font-bold text-[#8b95a1]">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#03c75a]" />~300m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3182f6]" />~500m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" />~800m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b95a1]" />800m+</span>
        </div>
        <span className="shrink-0 text-[#8b95a1]">기준 스케일: 최대 2km</span>
      </div>
    </div>
  );
}
