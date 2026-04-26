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
    <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-border">
        <h2 className="text-[16px] md:text-[18px] font-bold text-primary flex items-center gap-2">
          주요 편의시설 접근성
        </h2>
      </div>

      {/* Anchor List */}
      <div className="flex flex-col">
        {anchors.map((anchor) => {
          if (anchor.distance == null) return null;
          const walkingTime = Math.ceil(anchor.distance / 80);
          
          return (
            <div key={anchor.id} className="group flex items-center justify-between gap-3 md:gap-4 py-3.5 md:py-4 border-b border-body last:border-0 hover:bg-body transition-colors -mx-6 px-6 md:-mx-8 md:px-8 rounded-none first:mt-2 last:mb-0">
              
              {/* Left: Category & Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Category */}
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0 w-[60px] md:w-[70px]">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: anchor.color }}></div>
                  <span className="text-[12px] md:text-[13px] font-bold text-tertiary">{anchor.name}</span>
                </div>
                
                {/* Store Name & Address */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-primary font-bold text-[13px] md:text-[14px] truncate">
                    {anchor.metaName || "-"}
                  </span>
                  {anchor.metaAddress && (
                    <span className="text-tertiary font-medium text-[11px] md:text-[12px] truncate mt-px hidden md:block">
                      {anchor.metaAddress}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Right: Distance & Map */}
              <div className="flex items-center gap-3 md:gap-5 shrink-0">
                <div className="flex flex-col items-end justify-center">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[15px] md:text-[17px] font-extrabold text-primary tabular-nums">
                      {(anchor.distance / 1000).toFixed(2)}
                    </span>
                    <span className="text-[11px] font-medium text-tertiary ml-0.5">km</span>
                  </div>
                  <span className="text-[10px] md:text-[11px] font-medium text-secondary bg-body px-1.5 py-0.5 rounded-md mt-0.5">
                    도보 {walkingTime}분
                  </span>
                </div>
                
                {anchor.metaCoordinates && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${anchor.metaCoordinates}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 text-tertiary bg-surface border border-border hover:bg-body hover:text-secondary p-2 md:px-2.5 md:py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    title={`${anchor.metaName} 지도에서 보기`}
                  >
                    <MapPin size={14} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold hidden md:inline-block">지도</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

