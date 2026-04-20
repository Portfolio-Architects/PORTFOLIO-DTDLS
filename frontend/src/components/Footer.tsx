import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-transparent py-8 sm:py-10 mt-2 sm:mt-6 pb-32 sm:pb-12 border-t border-[#f2f4f6] md:border-0">
      <div className="max-w-[2000px] mx-auto px-5 sm:px-8 flex flex-col lg:flex-row lg:justify-between lg:items-center items-start gap-8 lg:gap-12">
        
        {/* 좌측: 로고 및 링크 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 lg:gap-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/d-view-icon.png" alt="D-VIEW Logo" className="w-[26px] h-[26px] rounded-[6px] grayscale opacity-70" />
            <span className="text-[15px] font-extrabold text-[#8b95a1] tracking-tight">D-VIEW</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <Link href="/terms" className="text-[13px] font-bold text-[#4e5968] hover:text-[#191f28] transition-colors">
              서비스 이용약관
            </Link>
            <Link href="/privacy" className="text-[13px] font-bold text-[#4e5968] hover:text-[#191f28] transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>

        {/* 우측: 정보 및 면책조항 */}
        <div className="flex flex-col items-start lg:items-end text-[12px] text-[#8b95a1] leading-relaxed font-medium w-full lg:max-w-[600px] xl:max-w-[700px]">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-2.5 lg:justify-end">
            <span>상호: D-VIEW</span>
            <span className="text-[#d1d6db]">|</span>
            <span>이메일: ocs5672@gmail.com</span>
            <span className="hidden sm:inline text-[#d1d6db]">|</span>
            <span className="w-full sm:w-auto">© {new Date().getFullYear()} D-VIEW. All rights reserved.</span>
          </div>
          
          <p className="text-left lg:text-right w-full tracking-tight text-[11.5px]">
            <strong className="text-[#4e5968] font-bold mr-1">면책 조항:</strong>
            D-VIEW가 제공하는 부동산 데이터 및 분석 리포트는 객관적인 정보 제공을 목적으로 하며, 단순 참고용입니다.<br />
            당사는 본 정보를 바탕으로 한 어떠한 투자 결과에 대해서도 법적 책임을 지지 않습니다.
          </p>
        </div>

      </div>
    </footer>
  );
}
