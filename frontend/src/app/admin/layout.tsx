'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Menu, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: '아파트 대시보드', icon: LayoutDashboard, section: 'Reports' },
    { href: '/admin/settings', label: '설정 (준비중)', icon: Settings, section: 'System' },
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
        <h2 className="text-[18px] font-bold text-[#EDF2F4] tracking-tight">Admin<span className="text-[#8D99AE]"> CMS</span></h2>
        <span className="text-[10px] bg-[#141C33] text-[#8D99AE] px-1.5 py-0.5 rounded-sm font-bold">Beta</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all ${
              isActive(link.href) ? 'bg-[#8D99AE] text-[#EDF2F4] shadow-lg shadow-[#8D99AE]/20' : 'text-[#8D99AE] hover:bg-[#0E1730]'
            }`}>
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-[#0E1730]">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-[#6B7394] hover:bg-[#0E1730] hover:text-[#8D99AE] transition-all">
          <ExternalLink size={16} /> 소비자 화면 보기
        </Link>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0E1730]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-[#1B2340] p-6 border-r border-[#1E2A45] fixed h-full overflow-y-auto z-30">
          <SidebarContent />
        </aside>

        {/* Spacer for fixed sidebar */}
        <div className="hidden md:block w-[240px] shrink-0" />

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1B2340]/80 backdrop-blur-lg border-b border-[#1E2A45] px-4 py-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#EDF2F4]">Admin<span className="text-[#8D99AE]"> CMS</span></h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[#8D99AE]">
            <Menu size={22} />
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="md:hidden fixed top-0 left-0 z-50 w-[280px] h-full bg-[#1B2340] flex flex-col p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-[#6B7394]">
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
