import React from 'react';
import LoungeHeader from '@/components/LoungeHeader';

export default function LoungeLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans selection:bg-[#3182f6]/20">
      <a href="#main-content" className="sr-only focus:not-sr-only">내용으로 건너뛰기</a>
      <LoungeHeader activeTab="lounge" />
      {children}
      {modal}
    </div>
  );
}
