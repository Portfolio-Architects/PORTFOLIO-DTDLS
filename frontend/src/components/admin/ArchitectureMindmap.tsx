'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
  id: string;
  group: string;
  weight: number;
  color: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

// ──── FALLBACK: Hardcoded Data ────
const FALLBACK_NODES: GraphNode[] = [
  { id: 'Firebase', group: 'core', weight: 10, color: '#F59E0B' },
  { id: 'Firestore', group: 'core', weight: 9, color: '#D97706' },
  { id: 'Next.js', group: 'core', weight: 9, color: '#374151' },
  { id: 'React', group: 'core', weight: 8, color: '#06B6D4' },
  { id: 'TypeScript', group: 'core', weight: 7, color: '#3B82F6' },
  { id: '임장기', group: 'page', weight: 8, color: '#6366F1' },
  { id: '라운지', group: 'page', weight: 6, color: '#10B981' },
  { id: '집추천', group: 'page', weight: 5, color: '#8B5CF6' },
  { id: '관리자', group: 'page', weight: 7, color: '#F43F5E' },
  { id: '권역별', group: 'page', weight: 5, color: '#0EA5E9' },
  { id: 'Report', group: 'data', weight: 9, color: '#EC4899' },
  { id: 'Review', group: 'data', weight: 6, color: '#A855F7' },
  { id: 'Post', group: 'data', weight: 5, color: '#7C3AED' },
  { id: 'Comment', group: 'data', weight: 4, color: '#818CF8' },
  { id: 'User', group: 'data', weight: 7, color: '#FB923C' },
  { id: 'Apartment', group: 'data', weight: 8, color: '#14B8A6' },
  { id: 'Transaction', group: 'data', weight: 7, color: '#38BDF8' },
  { id: 'location-scores', group: 'api', weight: 7, color: '#4ADE80' },
  { id: 'apartments-api', group: 'api', weight: 6, color: '#22D3EE' },
  { id: 'transactions-api', group: 'api', weight: 6, color: '#C084FC' },
  { id: 'type-map', group: 'api', weight: 5, color: '#F472B6' },
  { id: 'DashboardFacade', group: 'service', weight: 8, color: '#FB923C' },
  { id: 'Scoring', group: 'service', weight: 6, color: '#2DD4BF' },
  { id: 'Haversine', group: 'service', weight: 5, color: '#818CF8' },
  { id: 'ImageCompression', group: 'service', weight: 4, color: '#A78BFA' },
  { id: 'KPI', group: 'service', weight: 5, color: '#FB7185' },
  { id: '학군분석', group: 'feature', weight: 7, color: '#34D399' },
  { id: '교통접근성', group: 'feature', weight: 6, color: '#FBBF24' },
  { id: '프리미엄지표', group: 'feature', weight: 7, color: '#E879F9' },
  { id: '입주민인증', group: 'feature', weight: 4, color: '#22D3EE' },
  { id: '중복감지', group: 'feature', weight: 3, color: '#A3E635' },
  { id: '사진DB', group: 'feature', weight: 6, color: '#FCD34D' },
  { id: 'Chart', group: 'ui', weight: 5, color: '#6366F1' },
  { id: 'Modal', group: 'ui', weight: 6, color: '#06B6D4' },
  { id: 'Map', group: 'ui', weight: 4, color: '#84CC16' },
  { id: 'FloatingBar', group: 'ui', weight: 3, color: '#F59E0B' },
];

const FALLBACK_LINKS: GraphLink[] = [
  { source: 'Firebase', target: 'Firestore', strength: 1.0 },
  { source: 'Next.js', target: 'React', strength: 0.9 },
  { source: 'Next.js', target: 'TypeScript', strength: 0.8 },
  { source: 'React', target: 'TypeScript', strength: 0.7 },
  { source: 'Firestore', target: 'Report', strength: 0.9 },
  { source: 'Firestore', target: 'Review', strength: 0.7 },
  { source: 'Firestore', target: 'Post', strength: 0.7 },
  { source: 'Firestore', target: 'Comment', strength: 0.6 },
  { source: 'Firestore', target: 'User', strength: 0.8 },
  { source: 'Firestore', target: 'Apartment', strength: 0.7 },
  { source: 'DashboardFacade', target: 'Report', strength: 0.9 },
  { source: 'DashboardFacade', target: 'Review', strength: 0.8 },
  { source: 'DashboardFacade', target: 'Post', strength: 0.7 },
  { source: 'DashboardFacade', target: 'User', strength: 0.8 },
  { source: 'DashboardFacade', target: 'Firestore', strength: 0.9 },
  { source: 'DashboardFacade', target: 'KPI', strength: 0.6 },
  { source: 'DashboardFacade', target: '임장기', strength: 0.9 },
  { source: 'DashboardFacade', target: '라운지', strength: 0.7 },
  { source: '임장기', target: 'Report', strength: 1.0 },
  { source: '임장기', target: '프리미엄지표', strength: 0.8 },
  { source: '임장기', target: '사진DB', strength: 0.8 },
  { source: '임장기', target: 'Modal', strength: 0.7 },
  { source: '라운지', target: 'Post', strength: 0.9 },
  { source: '라운지', target: 'Comment', strength: 0.8 },
  { source: '집추천', target: 'KPI', strength: 0.7 },
  { source: '집추천', target: 'Chart', strength: 0.6 },
  { source: '관리자', target: 'Report', strength: 0.9 },
  { source: '관리자', target: '사진DB', strength: 0.8 },
  { source: '관리자', target: '중복감지', strength: 0.7 },
  { source: '관리자', target: 'ImageCompression', strength: 0.6 },
  { source: '권역별', target: 'Map', strength: 0.8 },
  { source: '권역별', target: 'Apartment', strength: 0.7 },
  { source: 'location-scores', target: '학군분석', strength: 0.9 },
  { source: 'location-scores', target: 'Haversine', strength: 0.8 },
  { source: 'location-scores', target: 'Apartment', strength: 0.7 },
  { source: 'location-scores', target: '교통접근성', strength: 0.7 },
  { source: 'apartments-api', target: 'Apartment', strength: 1.0 },
  { source: 'transactions-api', target: 'Transaction', strength: 1.0 },
  { source: 'type-map', target: 'Transaction', strength: 0.7 },
  { source: '학군분석', target: 'Scoring', strength: 0.8 },
  { source: '학군분석', target: 'Haversine', strength: 0.7 },
  { source: '교통접근성', target: 'Haversine', strength: 0.7 },
  { source: '프리미엄지표', target: 'Scoring', strength: 0.9 },
  { source: '프리미엄지표', target: 'Report', strength: 0.8 },
  { source: '입주민인증', target: 'User', strength: 0.8 },
  { source: '입주민인증', target: 'Apartment', strength: 0.6 },
  { source: 'Report', target: 'Apartment', strength: 0.8 },
  { source: 'Review', target: 'Apartment', strength: 0.7 },
  { source: 'Transaction', target: 'Apartment', strength: 0.9 },
  { source: 'Report', target: 'User', strength: 0.6 },
  { source: 'Review', target: 'User', strength: 0.6 },
  { source: 'Post', target: 'User', strength: 0.7 },
  { source: 'Chart', target: 'Transaction', strength: 0.7 },
  { source: 'Modal', target: 'Report', strength: 0.8 },
  { source: 'FloatingBar', target: '임장기', strength: 0.5 },
  { source: '사진DB', target: 'ImageCompression', strength: 0.8 },
];

const GROUP_META: Record<string, { label: string; color: string }> = {
  core:    { label: '코어 기술',    color: '#6366F1' },
  page:    { label: '페이지',      color: '#3B82F6' },
  data:    { label: '데이터 모델',  color: '#EC4899' },
  api:     { label: 'API',         color: '#10B981' },
  service: { label: '서비스/유틸',  color: '#F59E0B' },
  feature: { label: '기능',        color: '#8B5CF6' },
  ui:      { label: 'UI 컴포넌트', color: '#06B6D4' },
};

export default function ArchitectureMindmap() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [pinnedNode, setPinnedNode] = useState<GraphNode | null>(null);
  const activeNode = pinnedNode || hoverNode;
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: FALLBACK_NODES, links: FALLBACK_LINKS });
  const [dataSource, setDataSource] = useState<'local' | 'sheets'>('local');

  // Fetch from Google Sheets
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mindmap');
        if (!res.ok) return;
        const data = await res.json();
        if (data.nodes?.length > 0) {
          setGraphData({ nodes: data.nodes, links: data.links || [] });
          setDataSource('sheets');
        }
      } catch { /* use fallback */ }
    })();
  }, []);

  // Highlighted neighbors
  const highlightNodes = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const s = new Set<string>([activeNode.id]);
    graphData.links.forEach((link) => {
      const sId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const tId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      if (sId === activeNode.id) s.add(tId);
      if (tId === activeNode.id) s.add(sId);
    });
    return s;
  }, [activeNode, graphData.links]);

  // Canvas-based node rendering (2D)
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = 3 + (node.weight || 3) * 1.8;
    const isHovered = activeNode?.id === node.id;
    const isNeighbor = highlightNodes.has(node.id);
    const dimmed = activeNode && !isHovered && !isNeighbor;

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = dimmed ? `${node.color}30` : node.color;
    ctx.fill();

    // Glow on hover
    if (isHovered) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Label (only when zoomed enough or hovered/neighbor)
    const showLabel = globalScale > 1.2 || isHovered || isNeighbor;
    if (showLabel) {
      const fontSize = isHovered ? 12 : Math.max(9, 11 / globalScale);
      ctx.font = `${isHovered ? 'bold ' : '600 '}${fontSize}px -apple-system, "Pretendard", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = dimmed ? '#C0C0C0' : '#374151';
      ctx.fillText(node.id, node.x, node.y + r + 3);
    }
  }, [activeNode, highlightNodes]);

  // Link colors
  const linkColor = useCallback((link: any) => {
    if (!activeNode) return 'rgba(180,180,200,0.2)';
    const sId = typeof link.source === 'string' ? link.source : link.source?.id;
    const tId = typeof link.target === 'string' ? link.target : link.target?.id;
    if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 'rgba(99,102,241,0.6)';
    return 'rgba(200,200,210,0.05)';
  }, [activeNode, highlightNodes]);

  const linkWidth = useCallback((link: any) => {
    if (!activeNode) return 0.5;
    const sId = typeof link.source === 'string' ? link.source : link.source?.id;
    const tId = typeof link.target === 'string' ? link.target : link.target?.id;
    if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 2;
    return 0.15;
  }, [activeNode, highlightNodes]);

  // Zoom to fit on load
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current?.d3Force('charge')?.strength((node: any) => -60 * (node.weight || 1));
        fgRef.current?.d3Force('center')?.strength(0.05);
        fgRef.current?.d3Force('link')?.distance((link: any) => 40 + (1 - (link.strength || 0.5)) * 60);
      }, 100);
      setTimeout(() => fgRef.current?.zoomToFit(600, 60), 2000);
    }
  }, [graphData]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#FAFAFA] shadow-sm">
      {/* Header */}
      <div className="absolute top-5 left-6 z-10">
        <h3 className="text-[17px] font-extrabold text-[#1F2937] mb-0.5 tracking-tight">
          🧠 앱 아키텍처 맵
        </h3>
        <p className="text-[11px] text-[#9CA3AF] font-medium">
          드래그로 이동 · 스크롤로 줌 · 노드 클릭으로 연결 관계 고정
          {dataSource === 'sheets' && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-bold">📊 Google Sheets</span>
          )}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-5 right-6 z-10 flex flex-wrap gap-1.5 justify-end max-w-[200px]">
        {Object.entries(GROUP_META).map(([key, { label, color }]) => (
          <span key={key} className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-[#E5E7EB] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#4B5563] whitespace-nowrap">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Active Node Info Card */}
      {activeNode && (
        <div className="absolute bottom-5 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E5E7EB] px-4 py-3 max-w-[260px] animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: activeNode.color }} />
            <span className="text-[15px] font-extrabold text-[#1F2937]">{activeNode.id}</span>
            {pinnedNode && <span className="text-[11px]">📌</span>}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-medium">
            <span className="px-1.5 py-0.5 rounded bg-[#F3F4F6]">{GROUP_META[activeNode.group]?.label || activeNode.group}</span>
            <span>가중치 {activeNode.weight}</span>
            <span>연결 {highlightNodes.size - 1}개</span>
          </div>
        </div>
      )}

      {/* 2D Force Graph */}
      <div ref={containerRef} style={{ height: 500 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            const r = 3 + (node.weight || 3) * 1.8;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkCurvature={0.15}
          linkDirectionalParticles={(link: any) => {
            if (!activeNode) return 0;
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            return (highlightNodes.has(sId) && highlightNodes.has(tId)) ? 3 : 0;
          }}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#6366F1'}
          backgroundColor="#FAFAFA"
          onNodeHover={(node: any) => { if (!pinnedNode) setHoverNode(node || null); }}
          onNodeClick={(node: any) => {
            if (node) {
              // Toggle pin: clicking same node unpins, different node re-pins
              if (pinnedNode?.id === node.id) {
                setPinnedNode(null);
              } else {
                setPinnedNode(node);
                setHoverNode(null);
              }
              if (fgRef.current) {
                fgRef.current.centerAt(node.x, node.y, 800);
                fgRef.current.zoom(3, 800);
              }
            } else {
              setPinnedNode(null);
            }
          }}
          onBackgroundClick={() => { setPinnedNode(null); setHoverNode(null); }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={100}
          cooldownTicks={200}
          width={containerRef.current?.clientWidth || 800}
          height={500}
          enableNodeDrag={true}
        />
      </div>
    </div>
  );
}
