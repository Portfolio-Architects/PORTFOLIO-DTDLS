'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const reportId = searchParams.get('reportId');
      const userId = searchParams.get('userId');

      if (!paymentKey || !orderId || !amount || !reportId || !userId) {
        setStatus('error');
        setErrorMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            reportId,
            userId,
          }),
        });

        if (res.ok) {
          setStatus('success');
          // Redirect back to main page after 2 seconds
          setTimeout(() => {
            router.push('/?paymentSuccess=' + reportId);
          }, 2000);
        } else {
          const data = await res.json();
          setStatus('error');
          setErrorMessage(data.error || '결제 승인에 실패했습니다.');
        }
      } catch (e) {
        setStatus('error');
        setErrorMessage('서버 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0E1730] flex items-center justify-center p-6">
      <div className="bg-[#1B2340] rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {status === 'confirming' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#141C33] flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-[#8D99AE]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-extrabold text-[#EDF2F4] mb-2">결제 확인 중...</h1>
            <p className="text-[14px] text-[#6B7394]">잠시만 기다려주세요.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#e8faf0] flex items-center justify-center">
              <CheckCircle2 className="text-[#03c75a]" size={32} />
            </div>
            <h1 className="text-[22px] font-extrabold text-[#EDF2F4] mb-2">결제 완료! 🎉</h1>
            <p className="text-[14px] text-[#8D99AE] mb-6">임장기 전체 리포트를 이용하실 수 있습니다.</p>
            <p className="text-[12px] text-[#6B7394]">잠시 후 자동으로 이동합니다...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fff5f5] flex items-center justify-center">
              <span className="text-[32px]">😥</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-[#EDF2F4] mb-2">결제 실패</h1>
            <p className="text-[14px] text-[#EF233C] mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#8D99AE] text-[#EDF2F4] font-bold px-6 py-3 rounded-xl hover:bg-[#1b64da] transition-colors"
            >
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E1730] flex items-center justify-center">
        <div className="text-[#6B7394] font-bold">로딩 중...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
