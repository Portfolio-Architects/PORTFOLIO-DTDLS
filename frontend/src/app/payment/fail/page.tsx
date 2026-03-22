'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code') || '';
  const message = searchParams.get('message') || '결제가 취소되었거나 실패했습니다.';

  return (
    <div className="min-h-screen bg-[#0E1730] flex items-center justify-center p-6">
      <div className="bg-[#1B2340] rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fff5f5] flex items-center justify-center">
          <span className="text-[32px]">😥</span>
        </div>
        <h1 className="text-[22px] font-extrabold text-[#EDF2F4] mb-2">결제 실패</h1>
        <p className="text-[14px] text-[#8D99AE] mb-2">{message}</p>
        {code && <p className="text-[12px] text-[#6B7394] mb-6">에러 코드: {code}</p>}
        <button
          onClick={() => router.push('/')}
          className="bg-[#8D99AE] text-[#EDF2F4] font-bold px-6 py-3 rounded-xl hover:bg-[#1b64da] transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E1730] flex items-center justify-center">
        <div className="text-[#6B7394] font-bold">로딩 중...</div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
