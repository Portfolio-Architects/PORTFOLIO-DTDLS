'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ONTOLOGY_NODES, ONTOLOGY_EDGES, DOMAIN_META } from '@/lib/data/ontology';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GNode {
  id: string;
  label: string;
  domain: string;
  base_value: number;
  color: string;
  x?: number;
  y?: number;
}

interface GLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export default function ArchitectureMindmap() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<GNode | null>(null);
  const [pinnedNode, setPinnedNode] = useState<GNode | null>(null);
  const activeNode = pinnedNode || hoverNode;
  const [dataSource, setDataSource] = useState<'local' | 'sheets'>('local');

  // Local fallback data
  const localData = useMemo(() => {
    const nodes: GNode[] = ONTOLOGY_NODES.map(n => ({
      id: n.id, label: n.label, domain: n.domain,
      base_value: n.base_value, color: DOMAIN_META[n.domain]?.color || '#999',
    }));
    const links: GLink[] = ONTOLOGY_EDGES.map(e => ({
      source: e.source, target: e.target, type: e.type, weight: e.weight,
    }));
    return { nodes, links };
  }, []);

  const [graphData, setGraphData] = useState<{ nodes: GNode[]; links: GLink[] }>(localData);

  // Fetch from Google Sheets (with local fallback)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mindmap');
        if (!res.ok) return;
        const data = await res.json();
        if (data.nodes?.length > 0) {
          const nodes: GNode[] = data.nodes.map((n: any) => ({
            id: n.id, label: n.label || n.id,
            domain: n.domain || 'REAL_ESTATE',
            base_value: n.base_value || 50,
            color: DOMAIN_META[n.domain]?.color || '#999',
          }));
          const links: GLink[] = (data.links || []).map((e: any) => ({
            source: e.source, target: e.target,
            type: e.type || 'CORRELATION',
            weight: typeof e.weight === 'number' ? e.weight : 0.5,
          }));
          setGraphData({ nodes, links });
          setDataSource('sheets');
        }
      } catch { /* use local fallback */ }
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

  // Edge type color
  const edgeTypeColor = (type: string, w: number) => {
    if (type === 'HEDGE' || w < -0.2) return 'rgba(239,68,68,0.5)';
    if (type === 'CAUSAL_DRIVE') return 'rgba(99,102,241,0.55)';
    if (type === 'FEEDBACK_LOOP') return 'rgba(245,158,11,0.5)';
    if (type === 'DECOUPLING') return 'rgba(148,163,184,0.3)';
    return 'rgba(180,180,200,0.25)';
  };

  // Canvas node rendering — Eigenvector centrality sizing
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // base_value → radius: 100 → 22, 30 → 4
    const r = 3 + (node.base_value / 100) * 19;
    const isActive = activeNode?.id === node.id;
    const isNeighbor = highlightNodes.has(node.id);
    const dimmed = activeNode && !isActive && !isNeighbor;
    const isHedge = node.domain === 'HEDGE';

    // Outer glow for high base_value
    if (node.base_value >= 80 && !dimmed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
      const gradient = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 5);
      gradient.addColorStop(0, `${node.color}40`);
      gradient.addColorStop(1, `${node.color}00`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Hedge nodes: dashed ring
    if (isHedge && !dimmed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#EF444480';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = dimmed ? `${node.color}20` : node.color;
    ctx.fill();

    // Active ring
    if (isActive) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Label — show for large nodes, hovered, or zoomed in
    const showLabel = globalScale > 1.8 || isActive || isNeighbor || node.base_value >= 75;
    if (showLabel) {
      const fontSize = isActive ? 11 : Math.max(8, 10 / globalScale);
      ctx.font = `${isActive || node.base_value >= 80 ? 'bold ' : '600 '}${fontSize}px -apple-system, "Pretendard", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = dimmed ? '#C0C0C0' : isHedge ? '#DC2626' : '#374151';
      ctx.fillText(node.label, node.x, node.y + r + 3);
    }
  }, [activeNode, highlightNodes]);

  // Link colors
  const linkColor = useCallback((link: any) => {
    if (!activeNode) return edgeTypeColor(link.type, link.weight);
    const sId = typeof link.source === 'string' ? link.source : link.source?.id;
    const tId = typeof link.target === 'string' ? link.target : link.target?.id;
    if (highlightNodes.has(sId) && highlightNodes.has(tId)) {
      if (link.weight < -0.2) return 'rgba(239,68,68,0.7)';
      return 'rgba(99,102,241,0.7)';
    }
    return 'rgba(200,200,210,0.04)';
  }, [activeNode, highlightNodes]);

  const linkWidth = useCallback((link: any) => {
    if (!activeNode) return Math.max(0.3, Math.abs(link.weight) * 0.8);
    const sId = typeof link.source === 'string' ? link.source : link.source?.id;
    const tId = typeof link.target === 'string' ? link.target : link.target?.id;
    if (highlightNodes.has(sId) && highlightNodes.has(tId)) return Math.abs(link.weight) * 3;
    return 0.1;
  }, [activeNode, highlightNodes]);

  // Forces configuration
  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        // Eigenvector centrality — charge proportional to base_value
        fgRef.current?.d3Force('charge')?.strength((node: any) => -20 - (node.base_value || 30) * 0.8);
        fgRef.current?.d3Force('center')?.strength(0.03);
        fgRef.current?.d3Force('link')?.distance((link: any) => {
          const w = Math.abs(link.weight);
          return 30 + (1 - w) * 80;
        });
      }, 100);
      setTimeout(() => fgRef.current?.zoomToFit(600, 40), 2500);
    }
  }, [graphData]);

  // Stats
  const hedgeCount = graphData.links.filter(l => l.weight < -0.2).length;
  const causalCount = graphData.links.filter(l => l.type === 'CAUSAL_DRIVE').length;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#FAFAFA] shadow-sm">
      {/* Header */}
      <div className="absolute top-4 left-5 z-10">
        <h3 className="text-[16px] font-extrabold text-[#1F2937] mb-0.5 tracking-tight">
          🏗️ 동탄 부동산 온톨로지
        </h3>
        <p className="text-[10px] text-[#9CA3AF] font-medium">
          노드 {graphData.nodes.length}개 · 엣지 {graphData.links.length}개 · 클릭으로 연결 고정
          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-bold">
            ⚡ Eigenvector Centrality
          </span>
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-bold">
            {dataSource === 'sheets' ? '📊 Google Sheets' : '💾 로컬'}
          </span>
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-5 z-10 flex flex-wrap gap-1 justify-end max-w-[220px]">
        {Object.entries(DOMAIN_META).map(([key, { label, color }]) => (
          <span key={key} className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-[#E5E7EB] px-1.5 py-0.5 rounded-full text-[9px] font-bold text-[#4B5563] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Active Node Info Card */}
      {activeNode && (
        <div className="absolute bottom-4 left-5 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E5E7EB] px-4 py-3 max-w-[300px] animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: activeNode.color }} />
            <span className="text-[14px] font-extrabold text-[#1F2937]">{activeNode.label}</span>
            {pinnedNode && <span className="text-[10px]">📌</span>}
            <span className="ml-auto text-[10px] text-[#9CA3AF] font-mono">EV: {activeNode.base_value}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-medium flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-[#F3F4F6]">{DOMAIN_META[activeNode.domain]?.label || activeNode.domain}</span>
            <span>연결 {highlightNodes.size - 1}개</span>
            {activeNode.domain === 'HEDGE' && <span className="text-red-500 font-bold">⚠️ 리스크 헤지</span>}
          </div>
        </div>
      )}

      {/* Stats badge */}
      <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
        <span className="bg-white/80 backdrop-blur-sm border border-[#E5E7EB] px-2 py-1 rounded-lg text-[9px] font-bold text-[#6B7280]">
          🔀 인과 {causalCount}
        </span>
        <span className="bg-white/80 backdrop-blur-sm border border-red-200 px-2 py-1 rounded-lg text-[9px] font-bold text-red-400">
          🛡️ 헤지 {hedgeCount}
        </span>
      </div>

      {/* 2D Force Graph */}
      <div ref={containerRef} style={{ height: 550 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            const r = 3 + (node.base_value / 100) * 19 + 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkCurvature={0.12}
          linkDirectionalParticles={(link: any) => {
            if (!activeNode) return 0;
            const sId = typeof link.source === 'string' ? link.source : link.source?.id;
            const tId = typeof link.target === 'string' ? link.target : link.target?.id;
            if (highlightNodes.has(sId) && highlightNodes.has(tId)) {
              if (link.weight < -0.2) return 2;
              return 3;
            }
            return 0;
          }}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={(link: any) => link.weight < -0.2 ? '#EF4444' : '#6366F1'}
          linkLineDash={(link: any) => link.type === 'HEDGE' ? [4, 4] : link.type === 'DECOUPLING' ? [2, 6] : null}
          backgroundColor="#FAFAFA"
          onNodeHover={(node: any) => { if (!pinnedNode) setHoverNode(node || null); }}
          onNodeClick={(node: any) => {
            if (node) {
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
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.25}
          warmupTicks={150}
          cooldownTicks={300}
          width={containerRef.current?.clientWidth || 800}
          height={550}
          enableNodeDrag={true}
        />
      </div>
    </div>
  );
}
