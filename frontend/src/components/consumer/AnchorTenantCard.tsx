'use client';

/**
 * AnchorTenantCard — 앵커 테넌트 근접도 시각화 카드
 * 스타벅스, 올리브영, 다이소, 대형마트, 맥도날드까지의 거리를
 * 시각적 바 차트 + 등급 배지로 표시합니다.
 */

interface AnchorTenantCardProps {
  distanceToStarbucks?: number;
  distanceToOliveYoung?: number;
  distanceToDaiso?: number;
  distanceToSupermarket?: number;
  distanceToMcDonalds?: number;
}

interface AnchorItem {
  name: string;
  distance: number | undefined;
  color: string;
  bgColor: string;
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
    { name: '스타벅스', distance: props.distanceToStarbucks, color: '#00704A', bgColor: '#f0fdf4' },
    { name: '올리브영', distance: props.distanceToOliveYoung, color: '#03c75a', bgColor: '#f0fdf4' },
    { name: '다이소', distance: props.distanceToDaiso, color: '#EF4444', bgColor: '#fff0f1' },
    { name: '대형마트', distance: props.distanceToSupermarket, color: '#f59e0b', bgColor: '#fffbeb' },
    { name: '맥도날드', distance: props.distanceToMcDonalds, color: '#DA291C', bgColor: '#fff0f1' },
  ];

  const available = anchors.filter(a => a.distance != null);
  if (available.length === 0) return null;

  const TRACK_MAX_DISTANCE = 2000;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-[#e5e8eb] pb-3">
        <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2">
          주요 편의시설 접근성
        </h2>
      </div>

      {/* Anchor List */}
      <div className="flex flex-col gap-3">
        {anchors.map((anchor) => {
          if (anchor.distance == null) return null;
          const grade = getGrade(anchor.distance);
          const barWidth = Math.min(100, Math.max(1, (anchor.distance / TRACK_MAX_DISTANCE) * 100));

          return (
            <div key={anchor.name} className="flex items-center gap-3">
              {/* Icon + Name */}
              <div className="flex items-center gap-2 w-[70px] shrink-0">
                <span className="text-[13px] font-bold text-[#191f28]">{anchor.name}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-[#f2f4f6] rounded-full h-[8px] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: grade.color,
                  }}
                />
              </div>

              {/* Distance + Grade Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] font-extrabold text-[#191f28] tabular-nums w-[48px] text-right">
                  {anchor.distance}m
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                  style={{ color: grade.color, backgroundColor: grade.bg }}
                >
                  {grade.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — 기준 설명 */}
      <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex items-center justify-between text-[10px] font-bold text-[#8b95a1]">
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#03c75a]" />~300m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3182f6]" />~500m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" />~800m</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b95a1]" />800m+</span>
        </div>
        <span className="shrink-0 text-[#8b95a1] ml-2">기준 스케일: 최대 2km</span>
      </div>
    </div>
  );
}
