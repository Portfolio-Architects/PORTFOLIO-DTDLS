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
  /** 인증된 아파트명 (e.g., '[오산동] 동탄역 롯데캐슬') */
  verifiedApartment?: string;
  /** 인증 등급 */
  verificationLevel?: VerificationLevel;
  /** 프로필 생성 시각 */
  createdAt?: any;
}

/** 전체 표시 이름 조합 */
export function getDisplayName(profile: UserProfile): string {
  const front = profile.frontName || '동탄사는';
  return `${front} ${profile.nickname}`;
}
