/**
 * @module user.types
 * @description User profile type definitions.
 * Architecture Layer: Types (zero dependencies)
 */

/** 사용자 프로필 */
export interface UserProfile {
  /** 익명 닉네임 (자동 생성) */
  nickname: string;
  /** 프로필 생성 시각 */
  createdAt?: any;
}
