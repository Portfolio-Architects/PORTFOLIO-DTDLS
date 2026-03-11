'use client';

import Link from 'next/link';
import { PlusCircle, MapPin, Database, Activity, FileText, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { ScoutingReport } from '@/lib/types/scoutingReport';

export default function AdminDashboard() {
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'scoutingReports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoutingReport));
      setReports(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`정말로 '${name}' 임장기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteDoc(doc(db, 'scoutingReports', id));
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">프리미엄 임장기 관리</h1>
          <p className="text-[#4e5968] text-[15px]">CMS(Contents Management System) 통합 대시보드</p>
        </div>
        <Link 
          href="/admin/write-report" 
          className="flex items-center gap-2 bg-[#3182f6] hover:bg-[#2b72d6] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm"
        >
          <PlusCircle size={18} />
          새 임장기 작성하기
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#8b95a1]">
            <div className="p-2 bg-[#f0fdf4] rounded-lg text-[#03c75a]"><MapPin size={20} /></div>
            <h3 className="font-bold text-[14px]">총 임장기</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#191f28]">{reports.length}<span className="text-[18px] text-[#8b95a1] ml-1 font-semibold">건</span></div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#8b95a1]">
            <div className="p-2 bg-[#fff4e6] rounded-lg text-[#ff8a3d]"><Activity size={20} /></div>
            <h3 className="font-bold text-[14px]">총 조회수</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#191f28]">0</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#8b95a1]">
            <div className="p-2 bg-[#f2f4f6] rounded-lg text-[#3182f6]"><Database size={20} /></div>
            <h3 className="font-bold text-[14px]">DB 사용량</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#191f28]">0.0<span className="text-[18px] text-[#8b95a1] ml-1 font-semibold">MB</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e8eb] flex justify-between items-center bg-[#f9fafb]">
          <h3 className="font-bold text-[#191f28]">최근 작성된 임장기</h3>
        </div>
        
        {loading ? (
          <div className="p-16 flex justify-center items-center">
             <div className="w-8 h-8 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#f2f4f6] rounded-full flex items-center justify-center text-[#d1d6db] mb-4">
              <FileText size={32} />
            </div>
            <h4 className="text-[16px] font-bold text-[#333d4b] mb-2">아직 작성된 임장기가 없습니다.</h4>
            <p className="text-[#8b95a1] text-[14px] mb-6">첫 번째 동탄 지역 프리미엄 임장기를 작성해보세요.</p>
            <Link href="/admin/write-report" className="text-[#3182f6] font-bold text-[14px] hover:underline">
              작성 페이지로 이동하기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e8eb]">
            {reports.map((report) => (
              <div key={report.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f9fafb] transition-colors">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-[80px] h-[60px] rounded-lg overflow-hidden shrink-0 bg-[#f2f4f6]">
                     <img src={report.thumbnailUrl || report.images[0]?.url} alt={report.apartmentName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#f2f4f6] text-[#4e5968] text-[11px] font-bold px-2 py-0.5 rounded-md">{report.dong}</span>
                      <h4 className="text-[16px] font-bold text-[#191f28] truncate">{report.apartmentName}</h4>
                    </div>
                    {report.premiumScores && (
                       <p className="text-[13px] text-[#3182f6] font-semibold flex items-center gap-1 mb-1">
                          프리미엄 지수: <span className="text-[15px] font-bold">{report.premiumScores.totalPremiumScore}</span>점
                       </p>
                    )}
                    <div className="text-[12px] text-[#8b95a1] flex items-center gap-2">
                       <span>작성일: {new Date(report.createdAt).toLocaleDateString()}</span>
                       <span>·</span>
                       <span>지표수: {Object.keys(report.metrics).length}개</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                   <Link 
                     href={`/admin/edit-report/${report.id}`}
                     className="px-3 py-2 bg-white border border-[#e5e8eb] hover:bg-[#f2f4f6] text-[#8b95a1] hover:text-[#191f28] rounded-lg text-[13px] font-bold transition-colors flex items-center gap-1.5"
                   >
                     <Edit size={14} /> 수정
                   </Link>
                   <button 
                     onClick={() => handleDelete(report.id!, report.apartmentName)}
                     className="px-3 py-2 bg-white border border-[#e5e8eb] hover:bg-[#ffebec] hover:border-[#ffebec] hover:text-[#f04452] text-[#8b95a1] rounded-lg text-[13px] font-bold transition-colors flex items-center gap-1.5"
                   >
                     <Trash2 size={14} /> 삭제
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
