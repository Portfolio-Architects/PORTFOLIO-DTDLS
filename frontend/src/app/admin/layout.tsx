import type { Metadata } from 'next';
import AdminGuard from '@/components/auth/AdminGuard';
import { LayoutDashboard, FileText, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin CMS | Dongtan Data Labs',
  description: '관리자 전용 대시보드 및 콘텐츠 관리 시스템',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#f2f4f6]">
        {/* Admin Sidebar */}
        <aside className="w-[240px] bg-white border-r border-[#e5e8eb] flex flex-col p-6 sticky top-0 h-screen overflow-y-auto">
          <div className="mb-10 flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#191f28] tracking-tight">Admin<span className="text-[#3182f6]"> CMS</span></h2>
            <span className="text-[10px] bg-[#e8f3ff] text-[#3182f6] px-1.5 py-0.5 rounded-sm font-bold">Beta</span>
          </div>

          <nav className="flex flex-col gap-2 flex-grow">
            <p className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 uppercase tracking-wider">Reports</p>
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#3182f6] bg-[#e8f3ff] font-bold transition-colors">
              <LayoutDashboard size={18} />
              <span className="text-[14px]">대시보드 홈</span>
            </Link>
            <Link href="/admin/write-report" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4e5968] hover:bg-[#f2f4f6] font-medium transition-colors">
              <FileText size={18} />
              <span className="text-[14px]">임장기 작성</span>
            </Link>
            <Link href="/admin/floor-settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4e5968] hover:bg-[#f2f4f6] font-medium transition-colors">
              <Settings size={18} />
              <span className="text-[14px]">층수 관리</span>
            </Link>
            <Link href="/admin/name-mapping" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4e5968] hover:bg-[#f2f4f6] font-medium transition-colors">
              <Settings size={18} />
              <span className="text-[14px]">이름 매핑</span>
            </Link>

            <div className="mt-8 mb-2 border-t border-[#f2f4f6]"></div>
            
            <p className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 uppercase tracking-wider">System</p>
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4e5968] hover:bg-[#f2f4f6] font-medium transition-colors">
              <Settings size={18} />
              <span className="text-[14px]">설정 (준비중)</span>
            </Link>
          </nav>

          <Link href="/" className="mt-auto flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6] font-bold text-[13px] transition-colors">
            <ArrowLeft size={16} />
            소비자 화면으로
          </Link>
        </aside>

        {/* Admin Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
