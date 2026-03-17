/**
 * @module purchase.types
 * @description Purchase record type definitions for premium report paywall.
 * Architecture Layer: Types (zero dependencies)
 */

/** 결제 상태 */
export type PurchaseStatus = 'DONE' | 'CANCELED';

/** 구매 기록 */
export interface Purchase {
  /** Firestore document ID (auto-generated) */
  id?: string;
  /** Firebase Auth UID */
  userId: string;
  /** field_reports document ID */
  reportId: string;
  /** 토스페이먼츠 주문번호 */
  orderId: string;
  /** 토스페이먼츠 결제키 */
  paymentKey: string;
  /** 결제 금액 (원) */
  amount: number;
  /** 결제 상태 */
  status: PurchaseStatus;
  /** 구매 시각 */
  purchasedAt?: any;
}

/** 결제 요청 파라미터 */
export interface PaymentRequest {
  reportId: string;
  reportName: string;
  userId: string;
}

/** 임장기 가격 (원) */
export const REPORT_PRICE = 5000;
