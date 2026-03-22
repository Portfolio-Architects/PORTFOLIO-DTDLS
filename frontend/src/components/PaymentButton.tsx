'use client';

import { useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { REPORT_PRICE } from '@/lib/types/purchase.types';

// 테스트 환경 클라이언트 키 (실결제 시 .env.local의 NEXT_PUBLIC_TOSS_CLIENT_KEY로 교체)
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W23n07xlzm';

interface PaymentButtonProps {
  reportId: string;
  reportName: string;
  userId: string;
  userEmail?: string;
  onPaymentComplete: () => void;
  className?: string;
}

export default function PaymentButton({
  reportId,
  reportName,
  userId,
  userEmail,
  onPaymentComplete,
  className,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Generate unique order ID
      const orderId = `RPT_${reportId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Load TossPayments SDK
      const tossPayments = await loadTossPayments(CLIENT_KEY);

      // Initialize payment widget (anonymous customer for simplicity)
      const widgets = tossPayments.widgets({ customerKey: userId });

      // Set amount
      await widgets.setAmount({
        currency: 'KRW',
        value: REPORT_PRICE,
      });

      // Build success/fail URLs with context parameters
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/payment/success?reportId=${reportId}&userId=${userId}`;
      const failUrl = `${baseUrl}/payment/fail`;

      // Request payment via redirect (works on both PC and mobile)
      await widgets.requestPayment({
        orderId,
        orderName: `임장기 리포트: ${reportName}`,
        successUrl,
        failUrl,
        customerEmail: userEmail,
      });
    } catch (error: any) {
      // User cancelled or error
      if (error?.code === 'USER_CANCEL') {
        // User closed the payment window — do nothing
      } else {
        console.error('Payment request failed:', error);
        alert('결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className={`
        relative overflow-hidden
        bg-gradient-to-r from-[#8D99AE] to-[#4A6CF7]
        hover:from-[#1b64da] hover:to-[#3B5DE6]
        text-[#EDF2F4] font-extrabold text-[15px]
        px-8 py-4 rounded-2xl
        transition-all duration-200
        shadow-lg shadow-[#8D99AE]/25
        hover:shadow-xl hover:shadow-[#8D99AE]/30
        active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2.5
        ${className || ''}
      `}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          결제 처리중...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          ₩{REPORT_PRICE.toLocaleString()}으로 전체 리포트 보기
        </>
      )}
    </button>
  );
}
