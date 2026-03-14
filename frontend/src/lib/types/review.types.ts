/**
 * @module review.types
 * @description Type definitions for User Reviews (동네 리뷰).
 * Architecture Layer: Types (zero dependencies)
 */

/** 일반 유저 동네 리뷰 */
export interface UserReview {
  /** Firestore document ID */
  id: string;
  /** 아파트명 (e.g., '[청계동] 호반써밋 2차') */
  apartmentName: string;
  /** 행정동 (e.g., '청계동') */
  dong?: string;
  /** 별점 (1-5) */
  rating: number;
  /** 한줄평 */
  content: string;
  /** 사진 URL (선택) */
  photoURL?: string;
  /** 작성자 닉네임 */
  author: string;
  /** 작성자 UID */
  authorUid: string;
  /** 인증 아파트명 */
  verifiedApartment?: string;
  /** 인증 레벨 (self_declared | registry_verified) */
  verificationLevel?: string;
  /** 좋아요 수 */
  likes: number;
  /** 작성 시각 */
  createdAt: any;
}
