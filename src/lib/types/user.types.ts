/**
 * @module user.types
 * @description User profile type definitions with apartment verification.
 * Architecture Layer: Types (zero dependencies)
 */

/** 아파트 인증 등급 */
export type VerificationLevel = 'none' | 'self_declared' | 'registry_verified';

/** 사용자 프로필 */
export interface UserProfile {
  /** 익명 닉네임 (자동 생성) */
  nickname: string;
  /** 인증된 아파트명 (e.g., '[오산동] 동탄역 롯데캐슬') */
  verifiedApartment?: string;
  /** 인증 등급 */
  verificationLevel?: VerificationLevel;
  /** 프로필 생성 시각 */
  createdAt?: any;
}
