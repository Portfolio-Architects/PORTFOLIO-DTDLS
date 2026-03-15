'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';

interface GraphNode {
  id: string;
  group: string;
  weight: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
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
  { source: 'Modal', target: 'React', strength: 0.5 },
  { source: 'FloatingBar', target: 'User', strength: 0.6 },
  { source: 'Map', target: 'Haversine', strength: 0.6 },
];

// Category labels — softer pastel palette for light theme
const GROUP_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  core:    { label: '코어 기술', color: '#D97706', bg: '#FEF3C7' },
  page:    { label: '페이지', color: '#4F46E5', bg: '#EEF2FF' },
  data:    { label: '데이터', color: '#DB2777', bg: '#FCE7F3' },
  api:     { label: 'API', color: '#059669', bg: '#D1FAE5' },
  service: { label: '서비스', color: '#EA580C', bg: '#FFEDD5' },
  feature: { label: '기능', color: '#16A34A', bg: '#DCFCE7' },
  ui:      { label: 'UI', color: '#4F46E5', bg: '#E0E7FF' },
};

export default function ArchitectureMindmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [Component, setComponent] = useState<any>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(FALLBACK_NODES);
  const [links, setLinks] = useState<GraphLink[]>(FALLBACK_LINKS);
  const [dataSource, setDataSource] = useState<'fallback' | 'sheets'>('fallback');

  useEffect(() => {
    import('react-force-graph-3d').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);

  // Fetch data from Google Sheets API
  useEffect(() => {
    fetch('/api/mindmap')
      .then(res => res.json())
      .then(data => {
        if (data.nodes?.length > 0 && data.links?.length > 0) {
          setNodes(data.nodes);
          setLinks(data.links);
          setDataSource('sheets');
        }
      })
      .catch(() => {});
  }, []);

  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n })),
    links: links.map(l => ({ ...l })),
  }), [nodes, links]);

  const highlightNodes = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const connected = new Set<string>([hoverNode.id]);
    links.forEach(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      if (sId === hoverNode.id) connected.add(tId);
      if (tId === hoverNode.id) connected.add(sId);
    });
    return connected;
  }, [hoverNode, links]);

  // Light-theme node rendering
  const nodeThreeObject = useCallback((node: any) => {
    if (typeof window === 'undefined') return null;
    const THREE = require('three');
    const size = 2 + node.weight * 1.1;
    const isHighlighted = !hoverNode || highlightNodes.has(node.id);
    const opacity = isHighlighted ? 0.85 : 0.12;

    // Soft sphere with subtle glow
    const geometry = new THREE.SphereGeometry(size, 20, 20);
    const material = new THREE.MeshLambertMaterial({
      color: node.color,
      transparent: true,
      opacity,
    });
    const sphere = new THREE.Mesh(geometry, material);

    // Text label with dark text for readability on light bg
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = isHighlighted ? '#1F2937' : 'rgba(100,100,100,0.15)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size * 4, size * 1.2, 1);
    sprite.position.set(0, size + 2.5, 0);

    const group = new THREE.Group();
    group.add(sphere);
    group.add(sprite);
    return group;
  }, [hoverNode, highlightNodes]);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength((node: any) => -30 * (node.weight || 1));
      fgRef.current.d3Force('center')?.strength(0.05);
    }
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => fgRef.current?.zoomToFit(500, 100), 1500);
    }
  }, [Component]);

  if (!Component) {
    return (
      <div className="w-full h-[500px] rounded-3xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D1D5DB] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#9CA3AF] text-[13px] font-medium">3D 마인드맵 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#FAFAFA] shadow-sm">
      {/* Header — casual style */}
      <div className="absolute top-5 left-6 z-10">
        <h3 className="text-[17px] font-extrabold text-[#1F2937] mb-0.5 tracking-tight">
          🧠 앱 아키텍처 맵
        </h3>
        <p className="text-[11px] text-[#9CA3AF] font-medium">
          드래그로 회전 · 스크롤로 줌 · 노드 호버로 연결 탐색
          <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[#F3F4F6] text-[9px] text-[#6B7280] font-bold">
            {dataSource === 'sheets' ? '📊 Sheets 연동' : '💾 로컬'}
          </span>
        </p>
      </div>

      {/* Legend — pill chips */}
      <div className="absolute top-5 right-6 z-10 flex flex-wrap gap-1 max-w-[220px] justify-end">
        {Object.entries(GROUP_LABELS).map(([key, { label, color, bg }]) => (
          <span
            key={key}
            className="flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 border"
            style={{ backgroundColor: bg, color, borderColor: `${color}30` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Hover Info — floating card */}
      {hoverNode && (
        <div className="absolute bottom-5 left-6 z-10 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3.5 shadow-lg border border-[#E5E7EB] max-w-[260px]">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: hoverNode.color }} />
            <span className="text-[15px] font-bold text-[#1F2937]">{hoverNode.id}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-medium">
            <span className="px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[10px]">
              {GROUP_LABELS[hoverNode.group]?.label || hoverNode.group}
            </span>
            <span>가중치 {hoverNode.weight}/10</span>
            <span>연결 {links.filter(l => {
              const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
              const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
              return sId === hoverNode.id || tId === hoverNode.id;
            }).length}개</span>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ height: 500 }}>
        <Component
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={(link: any) => {
            if (!hoverNode) return 'rgba(180,180,195,0.15)';
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 'rgba(99,102,241,0.5)';
            return 'rgba(200,200,210,0.06)';
          }}
          linkWidth={(link: any) => {
            if (!hoverNode) return 0.4;
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 1.5;
            return 0.15;
          }}
          linkOpacity={0.5}
          backgroundColor="#FAFAFA"
          onNodeHover={(node: any) => setHoverNode(node || null)}
          onNodeClick={(node: any) => {
            if (fgRef.current && node) {
              const distance = 80;
              const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
              fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                1000
              );
            }
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={100}
          cooldownTicks={200}
          onEngineStop={handleEngineStop}
          width={containerRef.current?.clientWidth || 800}
          height={500}
          enableNavigationControls={true}
          showNavInfo={false}
        />
      </div>
    </div>
  );
}
