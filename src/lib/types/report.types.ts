/**
 * @module report.types
 * @description Type definitions for Field Reports, Report Sections, and Comments.
 * Architecture Layer: Types (zero dependencies)
 */

/** 임장기 섹션별 상세 데이터 */
export interface ReportSections {
  specs: { builtYear: string; scale: string; farBuild: string; parkingRatio: string; };
  infra: { gateText: string; gateImg?: string; landscapeText: string; landscapeImg?: string; parkingText: string; parkingImg?: string; maintenanceText: string; maintenanceImg?: string; };
  ecosystem: { communityText: string; communityImg?: string; schoolText: string; schoolImg?: string; commerceText: string; commerceImg?: string; };
  location: { trafficText: string; developmentText: string; };
  assessment: { alphaDriver: string; systemicRisk: string; synthesis: string; probability: string; };
}

/** 댓글 데이터 */
export interface CommentData {
  /** Firestore document ID */
  id: string;
  /** 댓글 본문 */
  text: string;
  /** 작성자 닉네임 */
  author: string;
  /** 작성 시각 */
  createdAt: any;
}

/** 현장 임장기 리포트 데이터 */
export interface FieldReportData {
  /** Firestore document ID */
  id: string;
  /** 행정동 (e.g., '오산동') */
  dong?: string;
  /** 아파트명 */
  apartmentName: string;
  /** 섹션별 상세 데이터 */
  sections?: ReportSections;
  /** 프리미엄 점수 (서버 계산) */
  premiumScores?: import('../utils/scoring').PremiumScores;
  /** 프리미엄 콘텐츠 텍스트 */
  premiumContent?: string;
  /** 장점 (Legacy) */
  pros?: string;
  /** 단점 (Legacy) */
  cons?: string;
  /** 평점 (Legacy, 1-5) */
  rating?: number;
  /** 작성자 닉네임 */
  author: string;
  /** 좋아요 수 */
  likes: number;
  /** 댓글 수 */
  commentCount: number;
  /** 댓글 목록 */
  comments?: CommentData[];
  /** 대표 이미지 URL (Legacy) */
  imageUrl?: string;
  /** 이미지 배열 (New Schema) */
  images?: { url: string; caption: string; locationTag: string; isPremium: boolean }[];
  /** 작성 시각 */
  createdAt: any;
}
