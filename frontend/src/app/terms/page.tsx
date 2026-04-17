import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '이용약관 | D-VIEW',
  description: 'D-VIEW 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans">
      <div className="bg-white border-b border-[#e5e8eb] sticky top-0 z-50">
        <div className="max-w-[800px] mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-[#191f28] text-lg">서비스 이용약관</h1>
          <Link href="/" className="text-[#3182f6] font-bold text-sm hover:underline">
            메인으로 돌아가기
          </Link>
        </div>
      </div>

      <main className="max-w-[800px] mx-auto p-4 sm:p-8 mt-4 mb-20 bg-white rounded-2xl shadow-sm border border-[#e5e8eb]">
        <article className="prose prose-sm sm:prose-base max-w-none text-[#4e5968]">
          <h2 className="text-xl font-bold text-[#191f28] mb-4">제1조 (목적)</h2>
          <p>
            본 약관은 D-VIEW(이하 "회사")가 제공하는 부동산 데이터 분석 및 관련 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-xl font-bold text-[#191f28] mt-8 mb-4">제2조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 효력을 발생합니다.</li>
            <li>회사는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 변경된 약관은 적용일자 7일 전부터 서비스 내 공지사항을 통해 공지합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-[#191f28] mt-8 mb-4">제3조 (서비스의 내용 및 면책 조항)</h2>
          <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#e5e8eb] my-4">
            <h3 className="text-base font-bold text-[#f04452] mb-2">⚠ 투자에 대한 면책</h3>
            <p className="text-sm">
              D-VIEW에서 제공하는 실거래가, 입지 분석, 시세 등의 데이터는 공공 데이터 및 자체 수집 데이터를 가공한 것으로서 정보 제공만을 목적으로 합니다. 
              <strong>회사는 제공된 정보의 정확성, 완전성, 신뢰성을 보증하지 않으며, 해당 정보를 바탕으로 한 회원의 투자 등 어떠한 결정이나 결과에 대해서도 법적 책임을 지지 않습니다.</strong>
            </p>
          </div>

          <h2 className="text-xl font-bold text-[#191f28] mt-8 mb-4">제4조 (회원의 의무 및 커뮤니티 이용 규칙)</h2>
          <p>회원은 다음 행위를 하여서는 안 되며, 적발 시 회사는 임의로 게시물 삭제 및 서비스 이용을 제한할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>다른 이용자, 회사 또는 제3자를 비방하거나 명예를 손상시키는 행위 (커뮤니티/라운지 등)</li>
            <li>회사의 승인 없이 광고성 정보(스팸)를 전송하거나 게시하는 행위</li>
            <li>기타 불법적이거나 부당한 행위</li>
          </ul>

          <h2 className="text-xl font-bold text-[#191f28] mt-8 mb-4">제5조 (결제 및 환불)</h2>
          <p>본 서비스의 일부 프리미엄 기능(리포트 열람 등)은 유료로 제공될 수 있으며 전자결제대행사(Toss Payments)를 통해 결제가 진행됩니다.</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>결제된 디지털 콘텐츠(분석 리포트)는 열람 즉시 가치가 훼손되는 상품으로, 원칙적으로 결제 후 환불이 불가합니다. 단, 시스템 오류 등으로 리포트가 정상적으로 제공되지 않은 경우에는 전액 환불합니다.</li>
            <li>환불과 관련된 세부 규정은 「전자상거래 등에서의 소비자보호에 관한 법률」을 준수합니다.</li>
          </ol>

          <h2 className="text-xl font-bold text-[#191f28] mt-8 mb-4">제6조 (관할법원)</h2>
          <p>서비스 이용과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는 회사의 본점 소재지를 관할하는 법원을 합의관할로 합니다.</p>

          <div className="mt-12 text-sm text-[#8b95a1]">
            <p>공고일자: 2026년 4월 18일</p>
            <p>시행일자: 2026년 4월 18일</p>
            <p className="mt-2">상호: D-VIEW | 이메일: ocs5672@gmail.com</p>
          </div>
        </article>
      </main>
    </div>
  );
}
