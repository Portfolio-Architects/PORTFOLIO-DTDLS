'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ONTOLOGY_NODES, ONTOLOGY_EDGES, DOMAIN_META } from '@/lib/data/ontology';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// ── User-friendly label mappings ──────────────────

const DOMAIN_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  MACRO:          { label: '경제·정책',   emoji: '🌏', desc: '거시경제, 정부정책, 산업클러스터' },
  REAL_ESTATE:    { label: '부동산',      emoji: '🏠', desc: '시세, 입지, 수요·공급 지표' },
  INFRASTRUCTURE: { label: '교통·생활',   emoji: '🚇', desc: '철도, 공원, 생활 인프라' },
  FINANCE:        { label: '금융·투자',   emoji: '💰', desc: '금리, 대출, 투자 수익률' },
  COMMERCIAL:     { label: '상권·편의',   emoji: '🛍️', desc: '상가, 음식점, 쇼핑시설' },
  RESIDENTIAL:    { label: '아파트단지',  emoji: '🏢', desc: '주요 아파트 브랜드 및 시설' },
  HEDGE:          { label: '리스크 요인', emoji: '⚠️', desc: '가격 하락 요인 및 위험 신호' },
};

const EDGE_TYPE_LABELS: Record<string, string> = {
  CAUSAL_DRIVE:  '직접 영향',
  CORRELATION:   '연관성',
  FEEDBACK_LOOP: '상호작용',
  HEDGE:         '위험 요인',
  DECOUPLING:    '약한 연결',
};

// ── Types ─────────────────────────────────────────

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

// ── Component ─────────────────────────────────────

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

  // Connected edges info for the active node
  const connectedEdges = useMemo(() => {
    if (!activeNode) return [];
    return graphData.links
      .filter((link) => {
        const sId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const tId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        return sId === activeNode.id || tId === activeNode.id;
      })
      .map((link) => {
        const sId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
        const tId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
        const neighborId = sId === activeNode.id ? tId : sId;
        const neighborNode = graphData.nodes.find(n => n.id === neighborId);
        return {
          neighborLabel: neighborNode?.label || neighborId,
          neighborDomain: neighborNode?.domain || '',
          neighborColor: neighborNode?.color || '#999',
          type: link.type,
          weight: link.weight,
          isOutgoing: sId === activeNode.id,
        };
      })
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }, [activeNode, graphData]);

  // Edge type color
  const edgeTypeColor = (type: string, w: number) => {
    if (type === 'HEDGE' || w < -0.2) return 'rgba(239,68,68,0.5)';
    if (type === 'CAUSAL_DRIVE') return 'rgba(99,102,241,0.55)';
    if (type === 'FEEDBACK_LOOP') return 'rgba(245,158,11,0.5)';
    if (type === 'DECOUPLING') return 'rgba(148,163,184,0.3)';
    return 'rgba(180,180,200,0.25)';
  };

  // Canvas node rendering
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;
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

    // Label
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

  // Importance level text
  const getImportanceLabel = (v: number) => {
    if (v >= 90) return { text: '핵심', color: '#EF4444' };
    if (v >= 70) return { text: '높음', color: '#F59E0B' };
    if (v >= 50) return { text: '보통', color: '#3B82F6' };
    return { text: '참고', color: '#9CA3AF' };
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-white shadow-sm">
      
      {/* ─── Header ─── */}
      <div className="px-5 pt-5 pb-3 border-b border-[#F3F4F6]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#1F2937] tracking-tight flex items-center gap-2">
              🧠 동탄 부동산 마인드맵
            </h3>
            <p className="text-[12px] text-[#9CA3AF] font-medium mt-0.5">
              노드를 클릭하면 연결된 관계를 확인할 수 있어요
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-bold">
                {graphData.nodes.length}개 항목 · {graphData.links.length}개 연결
              </span>
            </p>
          </div>
          <span className="text-[9px] px-2 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-bold shrink-0">
            {dataSource === 'sheets' ? '📊 실시간' : '💾 기본'}
          </span>
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(DOMAIN_LABELS).map(([key, { label, emoji }]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-1 rounded-full text-[10px] font-bold text-[#4B5563] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DOMAIN_META[key]?.color || '#999' }} />
              {emoji} {label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Main Content: Left Panel + Graph ─── */}
      <div className="flex flex-col md:flex-row">

        {/* Left Info Panel */}
        <div className="w-full md:w-[280px] shrink-0 border-r border-[#F3F4F6] bg-[#FAFAFA] p-4 md:max-h-[550px] md:overflow-y-auto custom-scrollbar">
          {activeNode ? (
            <div className="animate-in fade-in duration-200">
              {/* Selected node header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: activeNode.color }} />
                <span className="text-[15px] font-extrabold text-[#1F2937]">{activeNode.label}</span>
                {pinnedNode && <span className="text-[10px]">📌</span>}
              </div>

              {/* Category & Importance */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{
                  backgroundColor: `${activeNode.color}10`,
                  borderColor: `${activeNode.color}30`,
                  color: activeNode.color,
                }}>
                  {DOMAIN_LABELS[activeNode.domain]?.emoji} {DOMAIN_LABELS[activeNode.domain]?.label || activeNode.domain}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  backgroundColor: `${getImportanceLabel(activeNode.base_value).color}15`,
                  color: getImportanceLabel(activeNode.base_value).color,
                }}>
                  중요도: {getImportanceLabel(activeNode.base_value).text}
                </span>
              </div>

              {/* Connected relationships */}
              <div className="mb-3">
                <h4 className="text-[11px] font-bold text-[#8b95a1] mb-2">
                  📎 연결된 항목 ({connectedEdges.length}개)
                </h4>
                <div className="flex flex-col gap-1.5">
                  {connectedEdges.slice(0, 12).map((edge, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-[#E5E7EB] text-[11px]">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: edge.neighborColor }} />
                      <span className="text-[#374151] font-bold truncate flex-1">{edge.neighborLabel}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        edge.weight < -0.2
                          ? 'bg-red-50 text-red-500'
                          : edge.type === 'CAUSAL_DRIVE'
                            ? 'bg-indigo-50 text-indigo-500'
                            : edge.type === 'FEEDBACK_LOOP'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-gray-50 text-gray-500'
                      }`}>
                        {EDGE_TYPE_LABELS[edge.type] || edge.type}
                      </span>
                    </div>
                  ))}
                  {connectedEdges.length > 12 && (
                    <p className="text-[10px] text-[#9CA3AF] text-center py-1">+{connectedEdges.length - 12}개 더</p>
                  )}
                </div>
              </div>

              {/* Reset button */}
              {pinnedNode && (
                <button
                  onClick={() => { setPinnedNode(null); setHoverNode(null); }}
                  className="w-full text-center text-[11px] font-bold text-[#8b95a1] hover:text-[#3182f6] py-2 rounded-lg border border-[#E5E7EB] hover:border-[#3182f6] transition-colors mt-2"
                >
                  ✕ 선택 해제
                </button>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="text-[32px] mb-3 opacity-40">🔍</div>
              <p className="text-[13px] font-bold text-[#4e5968] mb-1">노드를 선택해보세요</p>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed max-w-[200px]">
                그래프의 원을 클릭하면<br/>
                연결된 관계를 확인할 수 있어요
              </p>

              {/* Quick stats */}
              <div className="flex gap-2 mt-6">
                <div className="bg-white rounded-lg border border-[#E5E7EB] px-3 py-2 text-center">
                  <div className="text-[16px] font-extrabold text-indigo-500">{causalCount}</div>
                  <div className="text-[9px] font-bold text-[#9CA3AF]">영향 관계</div>
                </div>
                <div className="bg-white rounded-lg border border-red-100 px-3 py-2 text-center">
                  <div className="text-[16px] font-extrabold text-red-400">{hedgeCount}</div>
                  <div className="text-[9px] font-bold text-[#9CA3AF]">위험 요인</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 relative" style={{ height: 550 }}>
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
            width={(containerRef.current?.clientWidth || 600)}
            height={550}
            enableNodeDrag={true}
          />
        </div>
      </div>
    </div>
  );
}
