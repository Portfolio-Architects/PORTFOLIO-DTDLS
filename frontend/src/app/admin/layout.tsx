'use client';

import AdminGuard from '@/components/auth/AdminGuard';
import { LayoutDashboard, FileText, Settings, ArrowLeft, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: '대시보드 홈', icon: LayoutDashboard, section: 'Reports' },
    { href: '/admin/write-report', label: '임장기 작성', icon: FileText, section: 'Reports' },
    { href: '/admin/apartments', label: '아파트 관리', icon: Settings, section: 'Reports' },
    { href: '/admin/settings', label: '설정 (준비중)', icon: Settings, section: 'System' },
  ];

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <>
      <div className="mb-10 flex items-center gap-2">
        <h2 className="text-[18px] font-bold text-[#191f28] tracking-tight">Admin<span className="text-[#3182f6]"> CMS</span></h2>
        <span className="text-[10px] bg-[#e8f3ff] text-[#3182f6] px-1.5 py-0.5 rounded-sm font-bold">Beta</span>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        {(['Reports', 'System'] as const).map((section, si) => (
          <div key={section}>
            {si > 0 && <div className="mt-6 mb-2 border-t border-[#f2f4f6]" />}
            <p className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 uppercase tracking-wider">{section}</p>
            {navLinks.filter(l => l.section === section).map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-[#3182f6] bg-[#e8f3ff] font-bold'
                    : 'text-[#4e5968] hover:bg-[#f2f4f6]'
                }`}
              >
                <link.icon size={18} />
                <span className="text-[14px]">{link.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <Link
        href="/"
        onClick={() => setSidebarOpen(false)}
        className="mt-auto flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6] font-bold text-[13px] transition-colors"
      >
        <ArrowLeft size={16} />
        소비자 화면으로
      </Link>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#f2f4f6]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[240px] bg-white border-r border-[#e5e8eb] flex-col p-6 sticky top-0 h-screen overflow-y-auto shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e8eb] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#191f28]">Admin<span className="text-[#3182f6]"> CMS</span></h2>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#f2f4f6] text-[#4e5968] transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="md:hidden fixed top-0 left-0 z-50 w-[280px] h-full bg-white flex flex-col p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-[#8b95a1]">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 lg:p-12 overflow-y-auto w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
