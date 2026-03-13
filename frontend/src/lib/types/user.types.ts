/**
 * @module user.types
 * @description User profile type definitions with apartment verification.
 * Architecture Layer: Types (zero dependencies)
 */

/** 아파트 인증 등급 */
export type VerificationLevel = 'none' | 'self_declared' | 'registry_verified';

/** 사용자 프로필 */
export interface UserProfile {
  /** 프론트 네임 (4글자, 기본값 '동탄사는') */
  frontName: string;
  /** 라스트 네임 (3글자, 자동 생성) */
  nickname: string;
  /** 프로필 사진 URL */
  photoURL?: string;
  /** 인증된 아파트명 (e.g., '[오산동] 동탄역 롯데캐슬') */
  verifiedApartment?: string;
  /** 인증 등급 */
  verificationLevel?: VerificationLevel;
  /** 동네 리뷰 작성 수 */
  reviewCount?: number;
  /** 프로필 생성 시각 */
  createdAt?: any;
}

/** 전체 표시 이름 조합 */
export function getDisplayName(profile: UserProfile): string {
  const front = profile.frontName || '동탄사는';
  return `${front} ${profile.nickname}`;
}

/** 리뷰어 레벨 정보 */
export interface UserLevel {
  level: number;
  title: string;
  badge: string;
}

/** 리뷰 수 기반 레벨 계산 */
export function computeUserLevel(reviewCount: number): UserLevel {
  if (reviewCount >= 10) return { level: 4, title: '동탄 마스터', badge: '🏆' };
  if (reviewCount >= 6) return { level: 3, title: '동탄 전문가', badge: '🏅' };
  if (reviewCount >= 3) return { level: 2, title: '동탄 주민', badge: '🏠' };
  if (reviewCount >= 1) return { level: 1, title: '동탄 탐험가', badge: '🚶' };
  return { level: 0, title: '새내기', badge: '🌱' };
}
