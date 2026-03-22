'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code') || '';
  const message = searchParams.get('message') || '결제가 취소되었거나 실패했습니다.';

  return (
    <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fff5f5] flex items-center justify-center">
          <span className="text-[32px]">😥</span>
        </div>
        <h1 className="text-[22px] font-extrabold text-[#191f28] mb-2">결제 실패</h1>
        <p className="text-[14px] text-[#3182f6] mb-2">{message}</p>
        {code && <p className="text-[12px] text-[#8b95a1] mb-6">에러 코드: {code}</p>}
        <button
          onClick={() => router.push('/')}
          className="bg-[#3182f6] text-[#191f28] font-bold px-6 py-3 rounded-xl hover:bg-[#1b64da] transition-colors"
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
      <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center">
        <div className="text-[#8b95a1] font-bold">로딩 중...</div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
