'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// ── 종합 보고서 마크다운 원문 ──
const REPORT_MD = `# 📋 PORTFOLIO-DTDLS — App 총괄 보고서
> **Date**: 2026-03-22 | **Grade**: A | **Branch**: master | **Status**: Active Development & Stabilization

---

## 📝 Patch Notes (변경 이력)

| 일시 | 항목 | 내용 |
|:---|:---|:---|
| 2026-03-22 22:40 | **Jest 유닛 테스트 도입** | apartmentMapping, transaction-summary 핵심 로직 16개 어설션 전수 통과 |
| 2026-03-22 22:40 | **버그 수정 (apartmentMapping)** | findTxKey 수동 매핑 정규화 누락 수정, 심층 정규화 실행 순서 버그 수정 |
| 2026-03-22 22:30 | **Admin 종합 보고서 페이지** | /admin/report 라우트 신설, Mermaid 다이어그램 동적 렌더링 포함 |
| 2026-03-22 21:00 | **현장 검증 배지 버그 수정** | page.tsx 배열 맵 타입 참조 오류 수정, DashboardFacade Fast Refresh 싱글톤 안정화 |
| 2026-03-22 20:00 | **Phase 1 구조 안정화** | 모놀리식 page.tsx에서 ApartmentCard, ApartmentModal, DongFilterBar, CommentSection 4개 컴포넌트 분리 |

---

## 1. Executive Summary (프로젝트 요약)
- **부동산 임장 및 밸류에이션 리포팅 허브**: 동탄 지역을 중심으로 실거래가, 아파트 단지 정보, 유저의 현장 검증(임장) 데이터를 통합하는 종합 부동산 인텔리전스 플랫폼.
- **실시간 데이터 동기화 파이프라인**: Google Sheets(마스터 데이터) 및 Firebase Firestore 이중 사용.
- **Facade 및 Repository 패턴**: Data Layer, Service Layer, 비즈니스 로직(Facade) 분리 아키텍처.
- **고도화된 시각화 및 UX**: 3D 지식 그래프, Recharts 인터랙티브 차트, 반응형 모달 시스템.

---

## 2. Tech Stack (기술 스택)

| 분류 | 기술 | 비고 |
|:---|:---|:---|
| **Frontend** | Next.js (App Router), React | 16.1.6 Turbopack |
| **Language** | TypeScript | strict type |
| **Styling** | Tailwind CSS, Lucide React | 디자인 토큰 |
| **DB & Auth** | Firebase (Firestore, Auth, Storage) | 실시간 리스너 |
| **External Data** | Google Sheets API | SSOT |
| **Visualization** | Recharts, 3d-force-graph | 차트 + 3D 매핑 |
| **State** | React Hooks, Singleton Facade | globalThis 패턴 |
| **Testing** | Jest, ts-jest | 16 assertions |
| **Markdown** | react-markdown, remark-gfm, mermaid | Admin 보고서 |

---

## 3. Codebase Metrics

- **Source Files**: ~80-100개 (src/)
- **LOC**: ~15,000-20,000
- **Components**: 35+ (Card, Modal, Chart, Layout 등)
- **API Routes**: 10개
- **Repositories**: 6개 핵심 모듈
- **Admin Pages**: 3개 (대시보드, 아파트 상세, 종합 보고서)
- **Test Suites**: 2개 / 16 assertions 전수 통과

---

## 4. Architecture

### 데이터 흐름도

\`\`\`mermaid
graph TB
    subgraph Client["Frontend (Browser)"]
        UI["React Components"]
        Facade["DashboardFacade (Singleton)"]
    end
    subgraph API["Next.js Server"]
        Routes["API Routes"]
        Admin["Firebase Admin SDK"]
    end
    subgraph Data["Data Sources"]
        Firestore[("Firestore")]
        GSheet[("Google Sheets")]
    end
    UI -->|useDashboardData| Facade
    Facade --> Firestore
    Facade --> Routes
    Routes --> GSheet
    Routes --> Admin
    Admin --> Firestore
\`\`\`

### 디렉토리 구조
\`\`\`
src/
├── app/
│   ├── api/              # API 엔드포인트
│   ├── admin/            # 관리자 (대시보드, report)
│   └── page.tsx          # 메인 페이지
├── components/
│   ├── dashboard/        # 대시보드 위젯
│   ├── features/         # ApartmentModal, Card, Filter, Comment
│   └── ui/               # 공통 UI
└── lib/
    ├── repositories/     # Firebase DAO
    ├── services/         # KPI, Logger
    ├── utils/            # apartmentMapping 정규화 엔진
    └── DashboardFacade.tsx
\`\`\`

---

## 5. Feature Inventory

| 도메인 | 기능 | 라우트/DB | 설명 |
|:---|:---|:---|:---|
| **Property** | 아파트 검색 | /api/apartments-by-dong | 동 단위 필터링 |
| **Market** | 실거래가 | /api/transaction-summary | 신고가, 차트 |
| **Validation** | 임장 리포트 | scoutingReports | 현장 팩트체크 |
| **Community** | 댓글/리뷰 | comments, reviews | 유저 피드백 |
| **Admin** | Sheets 동기화 | /api/admin/* | 일괄 업데이트 |
| **Admin** | 종합 보고서 | /admin/report | SSOT 리포트 |
| **Analytics** | Signal Map | MindMap3D | 3D 지식 그래프 |

---

## 6. Engineering Quality

| 영역 | 등급 | 사유 |
|:---|:---:|:---|
| **Architecture** | **A+** | Facade + Repository 패턴 |
| **Data Pipeline** | **A** | SSR 캐싱 + 실시간 Firebase |
| **UI/UX** | **A** | 스켈레톤, 반응형, 부드러운 전환 |
| **Error Handling** | **B+** | Hydration 방어 우수 |
| **Testing** | **B** | Jest 16 assertions 통과 |
| **Security** | **A** | Firebase Admin 인증 분리 |

> 💡 **Best Practice**: 문자열 정규화 엔진 — 테스트 과정에서 findTxKey 버그 2건 선제 발견 및 수정 완료.

---

## 7. Testing & CI/CD
- **Jest**: apartmentMapping (13), transaction-summary (3) = 16 assertions
- **CI/CD**: GitHub Actions / Vercel 연결 권장

---

## 8. Roadmap

### Phase 1 (단기)
- [x] Jest 유닛 테스트
- [x] 현장 검증 배지 버그 수정
- [x] Admin 종합 보고서 연동
- [ ] 오프라인 Fallback UI
- [ ] 3D 그래프 모바일 최적화

### Phase 2 (중장기)
- [ ] Anchor Tenant Metrics
- [ ] Google Sheets Write 고도화
- [ ] 개인화 필터링 & Push

---

## 9. Maintenance Policy
본 문서는 살아있는 SSOT입니다. 메이저 업데이트 시 지표를 갱신하고 패치노트를 기록합니다.
`;

// ── Mermaid 초기화 ──
mermaid.initialize({ startOnLoad: false, theme: 'default' });

export default function ReportPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;
      const nodes = containerRef.current.querySelectorAll('code.language-mermaid');
      for (let i = 0; i < nodes.length; i++) {
        const code = nodes[i];
        const pre = code.parentElement;
        if (!pre || pre.getAttribute('data-mermaid-rendered')) continue;
        pre.setAttribute('data-mermaid-rendered', 'true');
        const id = `mermaid-${i}`;
        try {
          const { svg } = await mermaid.render(id, code.textContent || '');
          const wrapper = document.createElement('div');
          wrapper.innerHTML = svg;
          wrapper.style.display = 'flex';
          wrapper.style.justifyContent = 'center';
          wrapper.style.margin = '1rem 0';
          pre.replaceWith(wrapper);
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      }
    };
    const timer = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight mb-2">종합 보고서</h1>
        <p className="text-secondary text-[14px]">프로젝트 아키텍처 및 엔지니어링 품질 총괄 리포트 (SSOT)</p>
      </div>

      <div ref={containerRef} className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-10">
        <article className="report-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{REPORT_MD}</ReactMarkdown>
        </article>
      </div>

      <style jsx global>{`
        .report-prose h1 { font-size: 1.8rem; font-weight: 800; color: #191f28; margin: 0 0 1rem; line-height: 1.3; }
        .report-prose h2 { font-size: 1.3rem; font-weight: 700; color: #191f28; margin: 2.5rem 0 0.8rem; padding-bottom: 0.4rem; border-bottom: 2px solid #e5e8eb; }
        .report-prose h3 { font-size: 1.05rem; font-weight: 700; color: #333d4b; margin: 1.5rem 0 0.5rem; }
        .report-prose p { color: #4e5968; line-height: 1.75; margin: 0.5rem 0; font-size: 0.9rem; }
        .report-prose ul { padding-left: 1.2rem; margin: 0.5rem 0; }
        .report-prose li { color: #4e5968; line-height: 1.8; font-size: 0.9rem; margin: 0.15rem 0; }
        .report-prose li input[type="checkbox"] { margin-right: 0.5rem; }
        .report-prose strong { color: #191f28; }
        .report-prose blockquote { border-left: 4px solid #3182f6; background: #f0f7ff; padding: 0.8rem 1rem; border-radius: 0 8px 8px 0; margin: 1rem 0; }
        .report-prose blockquote p { color: #333d4b; }
        .report-prose hr { border: none; border-top: 1px solid #e5e8eb; margin: 1.5rem 0; }
        .report-prose code { background: #f2f4f6; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.82rem; color: #e64980; }
        .report-prose pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 10px; overflow-x: auto; margin: 0.8rem 0; }
        .report-prose pre code { background: none; color: inherit; padding: 0; font-size: 0.8rem; }
        .report-prose table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; font-size: 0.85rem; }
        .report-prose th { background: #f8f9fa; color: #191f28; font-weight: 700; padding: 0.6rem 0.8rem; border: 1px solid #e5e8eb; text-align: left; white-space: nowrap; }
        .report-prose td { padding: 0.5rem 0.8rem; border: 1px solid #e5e8eb; color: #4e5968; }
        .report-prose tr:hover td { background: #f8fafb; }
      `}</style>
    </div>
  );
}
