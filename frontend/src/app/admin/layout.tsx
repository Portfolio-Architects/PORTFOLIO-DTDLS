'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Menu, X, ExternalLink, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: '아파트 대시보드', icon: LayoutDashboard, section: 'Reports' },
    { href: '/admin/traffic', label: '트래픽', icon: BarChart2, section: 'Reports' },
    { href: '/admin/report', label: '종합 보고서', icon: FileText, section: 'Reports' },
  ];

  const isActive = (href: string) => pathname === href;

  // Inject CSS for Firebase image thumbnails at runtime
  useEffect(() => {
    const styleId = 'admin-thumb-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = 'img[src*="firebasestorage"]{width:80px!important;height:60px!important;min-width:80px!important;max-width:80px!important;max-height:60px!important;object-fit:cover!important;border-radius:8px;flex-shrink:0}';
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const SidebarContent = () => (
    <>
      <div className="mb-10 flex items-center gap-2">
        <h2 className="text-[18px] font-bold text-[#191f28] tracking-tight">Admin<span className="text-[#3182f6]"> CMS</span></h2>
        <span className="text-[10px] bg-[#e8f3ff] text-[#3182f6] px-1.5 py-0.5 rounded-sm font-bold">Beta</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all ${
              isActive(link.href) ? 'bg-[#3182f6] text-white shadow-lg shadow-[#3182f6]/20' : 'text-[#4e5968] hover:bg-[#f2f4f6]'
            }`}>
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-[#f2f4f6]">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#3182f6] transition-all">
          <ExternalLink size={16} /> 소비자 화면 보기
        </Link>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#f2f4f6]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-white p-6 border-r border-[#e5e8eb] fixed h-full overflow-y-auto z-30">
          <SidebarContent />
        </aside>

        {/* Spacer for fixed sidebar */}
        <div className="hidden md:block w-[240px] shrink-0" />

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#e5e8eb] px-4 py-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#191f28]">Admin<span className="text-[#3182f6]"> CMS</span></h2>
          <div className="flex items-center gap-1">
            <Link href="/" className="p-2 text-[#8b95a1] hover:text-[#3182f6] transition-colors" title="소비자 화면 보기">
              <ExternalLink size={20} />
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[#4e5968]">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
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
        <main className="flex-1 p-4 pt-16 md:p-8 md:pt-6 lg:p-12 lg:pt-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col">
          <div className="hidden md:flex justify-end mb-4">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold text-[#8b95a1] hover:text-[#3182f6] hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-[#e5e8eb]">
              <ExternalLink size={15} /> 소비자 화면으로 가기
            </Link>
          </div>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
