'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';

// Lazy-load to avoid SSR issues with three.js
let ForceGraph3D: any = null;

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

// ──── App Architecture Node Data ────
// Weights based on codebase analysis: higher = more central
const NODES: GraphNode[] = [
  // Core (가장 높은 가중치 → 중심)
  { id: 'Firebase', group: 'core', weight: 10, color: '#FFCA28' },
  { id: 'Firestore', group: 'core', weight: 9, color: '#FFA726' },
  { id: 'Next.js', group: 'core', weight: 9, color: '#000000' },
  { id: 'React', group: 'core', weight: 8, color: '#61DAFB' },
  { id: 'TypeScript', group: 'core', weight: 7, color: '#3178C6' },

  // Pages
  { id: '임장기', group: 'page', weight: 8, color: '#3182F6' },
  { id: '라운지', group: 'page', weight: 6, color: '#36B37E' },
  { id: '집추천', group: 'page', weight: 5, color: '#6554C0' },
  { id: '관리자', group: 'page', weight: 7, color: '#FF5630' },
  { id: '권역별', group: 'page', weight: 5, color: '#00B8D9' },

  // Data Models
  { id: 'Report', group: 'data', weight: 9, color: '#E91E63' },
  { id: 'Review', group: 'data', weight: 6, color: '#9C27B0' },
  { id: 'Post', group: 'data', weight: 5, color: '#673AB7' },
  { id: 'Comment', group: 'data', weight: 4, color: '#7C4DFF' },
  { id: 'User', group: 'data', weight: 7, color: '#FF7043' },
  { id: 'Apartment', group: 'data', weight: 8, color: '#26A69A' },
  { id: 'Transaction', group: 'data', weight: 7, color: '#42A5F5' },

  // APIs
  { id: 'location-scores', group: 'api', weight: 7, color: '#66BB6A' },
  { id: 'apartments-api', group: 'api', weight: 6, color: '#29B6F6' },
  { id: 'transactions-api', group: 'api', weight: 6, color: '#AB47BC' },
  { id: 'type-map', group: 'api', weight: 5, color: '#EC407A' },

  // Services & Utils
  { id: 'DashboardFacade', group: 'service', weight: 8, color: '#FF8A65' },
  { id: 'Scoring', group: 'service', weight: 6, color: '#4DB6AC' },
  { id: 'Haversine', group: 'service', weight: 5, color: '#7986CB' },
  { id: 'ImageCompression', group: 'service', weight: 4, color: '#A1887F' },
  { id: 'KPI', group: 'service', weight: 5, color: '#F06292' },

  // Features
  { id: '학군분석', group: 'feature', weight: 7, color: '#4CAF50' },
  { id: '교통접근성', group: 'feature', weight: 6, color: '#FF9800' },
  { id: '프리미엄지표', group: 'feature', weight: 7, color: '#E040FB' },
  { id: '입주민인증', group: 'feature', weight: 4, color: '#00BCD4' },
  { id: '중복감지', group: 'feature', weight: 3, color: '#8BC34A' },
  { id: '사진DB', group: 'feature', weight: 6, color: '#FFC107' },

  // UI Components
  { id: 'Chart', group: 'ui', weight: 5, color: '#5C6BC0' },
  { id: 'Modal', group: 'ui', weight: 6, color: '#26C6DA' },
  { id: 'Map', group: 'ui', weight: 4, color: '#9CCC65' },
  { id: 'FloatingBar', group: 'ui', weight: 3, color: '#FFCA28' },
];

// ──── Co-occurrence Based Links ────
// Connected if they appear in the same file / have import relationships
const LINKS: GraphLink[] = [
  // Core connections
  { source: 'Firebase', target: 'Firestore', strength: 1.0 },
  { source: 'Next.js', target: 'React', strength: 0.9 },
  { source: 'Next.js', target: 'TypeScript', strength: 0.8 },
  { source: 'React', target: 'TypeScript', strength: 0.7 },

  // Firebase → Data layer
  { source: 'Firestore', target: 'Report', strength: 0.9 },
  { source: 'Firestore', target: 'Review', strength: 0.7 },
  { source: 'Firestore', target: 'Post', strength: 0.7 },
  { source: 'Firestore', target: 'Comment', strength: 0.6 },
  { source: 'Firestore', target: 'User', strength: 0.8 },
  { source: 'Firestore', target: 'Apartment', strength: 0.7 },

  // DashboardFacade → everything
  { source: 'DashboardFacade', target: 'Report', strength: 0.9 },
  { source: 'DashboardFacade', target: 'Review', strength: 0.8 },
  { source: 'DashboardFacade', target: 'Post', strength: 0.7 },
  { source: 'DashboardFacade', target: 'User', strength: 0.8 },
  { source: 'DashboardFacade', target: 'Firestore', strength: 0.9 },
  { source: 'DashboardFacade', target: 'KPI', strength: 0.6 },
  { source: 'DashboardFacade', target: '임장기', strength: 0.9 },
  { source: 'DashboardFacade', target: '라운지', strength: 0.7 },

  // Pages → Features
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

  // APIs → Data
  { source: 'location-scores', target: '학군분석', strength: 0.9 },
  { source: 'location-scores', target: 'Haversine', strength: 0.8 },
  { source: 'location-scores', target: 'Apartment', strength: 0.7 },
  { source: 'location-scores', target: '교통접근성', strength: 0.7 },
  { source: 'apartments-api', target: 'Apartment', strength: 1.0 },
  { source: 'transactions-api', target: 'Transaction', strength: 1.0 },
  { source: 'type-map', target: 'Transaction', strength: 0.7 },

  // Features → Services
  { source: '학군분석', target: 'Scoring', strength: 0.8 },
  { source: '학군분석', target: 'Haversine', strength: 0.7 },
  { source: '교통접근성', target: 'Haversine', strength: 0.7 },
  { source: '프리미엄지표', target: 'Scoring', strength: 0.9 },
  { source: '프리미엄지표', target: 'Report', strength: 0.8 },
  { source: '입주민인증', target: 'User', strength: 0.8 },
  { source: '입주민인증', target: 'Apartment', strength: 0.6 },

  // Data → Data
  { source: 'Report', target: 'Apartment', strength: 0.8 },
  { source: 'Review', target: 'Apartment', strength: 0.7 },
  { source: 'Transaction', target: 'Apartment', strength: 0.9 },
  { source: 'Report', target: 'User', strength: 0.6 },
  { source: 'Review', target: 'User', strength: 0.6 },
  { source: 'Post', target: 'User', strength: 0.7 },

  // UI connections
  { source: 'Chart', target: 'Transaction', strength: 0.7 },
  { source: 'Modal', target: 'Report', strength: 0.8 },
  { source: 'Modal', target: 'React', strength: 0.5 },
  { source: 'FloatingBar', target: 'User', strength: 0.6 },
  { source: 'Map', target: 'Haversine', strength: 0.6 },
];

// Category labels for legend
const GROUP_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: '코어 기술', color: '#FFCA28' },
  page: { label: '페이지', color: '#3182F6' },
  data: { label: '데이터 모델', color: '#E91E63' },
  api: { label: 'API', color: '#66BB6A' },
  service: { label: '서비스/유틸', color: '#FF8A65' },
  feature: { label: '기능', color: '#4CAF50' },
  ui: { label: 'UI 컴포넌트', color: '#5C6BC0' },
};

export default function ArchitectureMindmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [Component, setComponent] = useState<any>(null);

  // Dynamically import react-force-graph-3d (SSR-incompatible)
  useEffect(() => {
    import('react-force-graph-3d').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);

  // Graph data
  const graphData = useMemo(() => ({
    nodes: NODES.map(n => ({ ...n })),
    links: LINKS.map(l => ({ ...l })),
  }), []);

  // Highlight connected nodes on hover
  const highlightNodes = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const connected = new Set<string>([hoverNode.id]);
    LINKS.forEach(l => {
      if (l.source === hoverNode.id) connected.add(l.target);
      if (l.target === hoverNode.id) connected.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
    });
    return connected;
  }, [hoverNode]);

  // Node rendering
  const nodeThreeObject = useCallback((node: any) => {
    if (typeof window === 'undefined') return null;
    const THREE = require('three');
    const size = 2 + node.weight * 1.2;
    const isHighlighted = !hoverNode || highlightNodes.has(node.id);
    const opacity = isHighlighted ? 1 : 0.15;

    // Sphere
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: node.color,
      transparent: true,
      opacity,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(geometry, material);

    // Text sprite
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size * 4, size * 1.2, 1);
    sprite.position.set(0, size + 3, 0);

    const group = new THREE.Group();
    group.add(sphere);
    group.add(sprite);
    return group;
  }, [hoverNode, highlightNodes]);

  // Center heavy nodes with charge force
  const handleEngineStop = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength((node: any) => {
        return -30 * (node.weight || 1);
      });
      fgRef.current.d3Force('center')?.strength(0.05);
    }
  }, []);

  // Camera zoom to fit
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(500, 100);
      }, 1500);
    }
  }, [Component]);

  if (!Component) {
    return (
      <div className="w-full h-[500px] rounded-3xl bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-[13px]">3D 마인드맵 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#1c2333] bg-[#0d1117] shadow-xl">
      {/* Header */}
      <div className="absolute top-4 left-5 z-10">
        <h3 className="text-[16px] font-extrabold text-white/90 mb-0.5">앱 아키텍처 3D 마인드맵</h3>
        <p className="text-[11px] text-white/40">드래그/줌으로 탐색 · 노드 호버 시 연결 관계 표시</p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-5 z-10 flex flex-wrap gap-1.5 max-w-[200px] justify-end">
        {Object.entries(GROUP_LABELS).map(([key, { label, color }]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-white/60 bg-white/5 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Hover Info Panel */}
      {hoverNode && (
        <div className="absolute bottom-4 left-5 z-10 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 max-w-[250px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hoverNode.color }} />
            <span className="text-[14px] font-bold text-white">{hoverNode.id}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/50">
            <span>{GROUP_LABELS[hoverNode.group]?.label}</span>
            <span>가중치: {hoverNode.weight}/10</span>
            <span>연결: {LINKS.filter(l => l.source === hoverNode.id || l.target === hoverNode.id).length}개</span>
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
            if (!hoverNode) return 'rgba(255,255,255,0.08)';
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 'rgba(49,130,246,0.6)';
            return 'rgba(255,255,255,0.03)';
          }}
          linkWidth={(link: any) => {
            if (!hoverNode) return 0.5;
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (highlightNodes.has(sId) && highlightNodes.has(tId)) return 1.5;
            return 0.2;
          }}
          linkOpacity={0.6}
          backgroundColor="#0d1117"
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
