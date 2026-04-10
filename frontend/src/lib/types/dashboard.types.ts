/**
 * @module dashboard.types
 * @description Pure type definitions for KPI and News Feed data.
 * Architecture Layer: Types (zero dependencies, zero logic)
 */
import { type ElementType } from 'react';

/** KPI 카드 데이터 모델 */
export interface KPIData {
  /** 고유 식별자 */
  id: string;
  /** 카드 제목 (e.g., '이번주 최고가') */
  title: string;
  /** 부제목 (e.g., '동탄역 롯데캐슬 84㎡') */
  subtitle: string;
  /** 뱃지 텍스트 (e.g., 'HOT') */
  badgeText?: string;
  /** 뱃지 CSS 클래스 */
  badgeStyle?: string;
  /** 메인 표시 값 (숫자 또는 JSX) */
  mainValue: string | React.ReactNode;
  /** 보조 값 (증감률 등) */
  subValue: string | React.ReactNode;
  /** 하단 설명 */
  description: string | React.ReactNode;
  /** 아이콘 컴포넌트 */
  icon: ElementType;
  /** 배경 그라디언트 CSS 클래스 */
  gradientBackground: string;
  /** 테두리 색상 CSS 클래스 */
  borderColor: string;
  /** 제목 색상 CSS 클래스 */
  titleColor: string;
}

/** 뉴스 피드(라운지) 항목 */
export interface NewsItemData {
  /** 고유 식별자 */
  id: string;
  /** 게시글 제목 */
  title: string;
  /** 메타 정보 (e.g., '방금 전 · 부동산') */
  meta: string;
  /** 게시글 내용 (피드 노출용 프리뷰) */
  content?: string;
  /** 작성자 닉네임 */
  author: string;
  /** 첨부 이미지 URL */
  imageUrl?: string;
  /** 태그 CSS 클래스 (e.g., 'tag-traffic') */
  tagClass: string;
  /** 태그 아이콘 컴포넌트 */
  icon: ElementType;
  /** 좋아요 수 */
  likes?: number;
  /** 조회수 (방문자 카운팅) */
  views?: number;
  /** 작성자 UID (삭제 권한 확인용) */
  authorUid?: string;
  /** 인증된 아파트명 */
  verifiedApartment?: string;
  /** 인증 등급 ('self_declared' | 'registry_verified') */
  verificationLevel?: string;
}

/** 광고 배너 데이터 */
export interface AdBannerData {
  /** 배너 제목 */
  title: string;
  /** 배너 설명 */
  description: string;
  /** CTA 버튼 텍스트 */
  buttonText: string;
}
