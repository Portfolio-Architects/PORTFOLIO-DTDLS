import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * AnchorTenantCard — 앵커 테넌트 근접도 시각화 카드
 * 스타벅스, 올리브영, 다이소, 대형마트, 맥도날드까지의 거리를
 * 깔끔하고 모던한 UI로 표시합니다.
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
  metaName?: string;
  metaAddress?: string;
  metaCoordinates?: string;
}

export default function AnchorTenantCard(props: AnchorTenantCardProps) {
  const anchors: AnchorItem[] = [
    { 
      id: 'starbucks',
      name: '스타벅스', 
      distance: props.distanceToStarbucks, 
      color: '#00704A', 
      metaName: props.starbucksName,
      metaAddress: props.starbucksAddress,
      metaCoordinates: props.starbucksCoordinates
    },
    { 
      id: 'oliveyoung', 
      name: '올리브영', 
      distance: props.distanceToOliveYoung, 
      color: '#9db44f', 
      metaName: props.oliveYoungName,
      metaAddress: props.oliveYoungAddress,
      metaCoordinates: props.oliveYoungCoordinates
    },
    { 
      id: 'daiso', 
      name: '다이소', 
      distance: props.distanceToDaiso, 
      color: '#E02020', 
      metaName: props.daisoName,
      metaAddress: props.daisoAddress,
      metaCoordinates: props.daisoCoordinates
    },
    { 
      id: 'supermarket', 
      name: '대형마트', 
      distance: props.distanceToSupermarket, 
      color: '#f59e0b', 
      metaName: props.supermarketName,
      metaAddress: props.supermarketAddress,
      metaCoordinates: props.supermarketCoordinates
    },
    { 
      id: 'mcdonalds', 
      name: '맥도날드', 
      distance: props.distanceToMcDonalds, 
      color: '#DA291C', 
      metaName: props.mcdonaldsName,
      metaAddress: props.mcdonaldsAddress,
      metaCoordinates: props.mcdonaldsCoordinates
    },
  ];

  const available = anchors.filter(a => a.distance != null);
  if (available.length === 0) return null;

  const TRACK_MAX_DISTANCE = 2000;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-[#e5e8eb]">
        <h2 className="text-[16px] md:text-[18px] font-bold text-[#191f28] flex items-center gap-2">
          주요 편의시설 접근성
        </h2>
      </div>

      {/* Anchor List */}
      <div className="flex flex-col">
        {anchors.map((anchor) => {
          if (anchor.distance == null) return null;
          const walkingTime = Math.ceil(anchor.distance / 80);
          const barWidth = Math.min(100, Math.max(1, (anchor.distance / TRACK_MAX_DISTANCE) * 100));
          
          return (
            <div key={anchor.id} className="group flex flex-col py-4 border-b border-[#f2f4f6] last:border-0 relative">
              
              {/* Top Row: Label & Distance Info */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                {/* Category Label */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: anchor.color }}></div>
                  <span className="text-[13px] md:text-[14px] font-bold text-[#4e5968]">{anchor.name}</span>
                </div>
                
                {/* Distance & Walking Time */}
                <div className="flex items-baseline gap-1.5 md:gap-2">
                  <span className="text-[15px] md:text-[16px] font-extrabold text-[#191f28] tabular-nums text-right">
                    {(anchor.distance / 1000).toFixed(2)}<span className="text-[11px] font-medium text-[#8b95a1] ml-0.5">km</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#4e5968] bg-[#f2f4f6] px-1.5 py-0.5 rounded-md">
                    도보 {walkingTime}분
                  </span>
                </div>
              </div>

              {/* Thin Progress Bar */}
              <div className="w-full bg-[#f2f4f6] rounded-full h-[4px] overflow-hidden mb-3.5">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-[#d1d6db] group-hover:bg-[#8b95a1]"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Bottom Row: Detail Card */}
              {anchor.metaName && (
                <div className="flex items-center justify-between gap-3 bg-[#f9fafb] border border-[#e5e8eb] px-3.5 py-3 rounded-xl transition-colors">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="text-[#191f28] font-bold text-[12px] md:text-[13px] truncate">
                      {anchor.metaName}
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
                      className="shrink-0 text-[#4e5968] bg-white border border-[#e5e8eb] hover:bg-[#f2f4f6] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      title={`${anchor.metaName} 지도에서 보기`}
                    >
                      <MapPin size={12} strokeWidth={2.5} />
                      <span className="text-[11px] font-bold tracking-tight">지도</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

