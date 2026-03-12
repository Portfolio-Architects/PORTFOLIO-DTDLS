'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Camera, MapPin, ArrowLeft } from 'lucide-react';
import { useDashboardData, dashboardFacade, FieldReportData } from '@/lib/DashboardFacade';
import { ZONES, dongToZoneId, getZoneById } from '@/lib/zones';
import { FieldReportModal } from '@/app/page';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function ZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;
  const zone = getZoneById(zoneId);

  const { fieldReports } = useDashboardData();
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Comments state for modal
  const [commentsData, setCommentsData] = useState<Record<string, any[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen to comments when a report is selected
  useEffect(() => {
    if (selectedReport && !commentsData[selectedReport.id]) {
      const unsubscribe = dashboardFacade.listenToComments(selectedReport.id, (comments) => {
        setCommentsData(prev => ({ ...prev, [selectedReport.id]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport]);

  const handleSubmitComment = async (reportId: string) => {
    if (!user) return;
    const text = commentInput[reportId];
    if (!text?.trim()) return;
    await dashboardFacade.addFieldReportComment(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  // Filter reports that belong to this zone
  const zoneReports = useMemo(() => {
    return fieldReports?.filter(report => dongToZoneId(report.dong) === zoneId) || [];
  }, [fieldReports, zoneId]);

  if (!zone) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8b95a1] text-[16px] mb-4">존재하지 않는 권역입니다.</p>
          <button onClick={() => router.push('/')} className="text-[#3182f6] font-bold">← 메인으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8eb] sticky top-0 z-40">
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#4e5968] hover:text-[#191f28] transition-colors font-bold text-[14px]"
          >
            <ArrowLeft size={18} />
            전체 권역
          </button>
          <div className="w-px h-5 bg-[#e5e8eb]" />
          <h1 className="text-[16px] font-extrabold text-[#191f28] truncate">{zone.name}</h1>
        </div>
      </header>

      {/* Zone Hero Banner */}
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-4">
        <div className="bg-white rounded-3xl border border-[#e5e8eb] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] font-bold px-3 py-1 rounded-lg text-white" style={{ backgroundColor: zone.color }}>{zone.dongLabel}</span>
                <span className="bg-[#f2f4f6] text-[#4e5968] text-[13px] font-bold px-3 py-1 rounded-lg">{zoneReports.length}개 단지</span>
              </div>
              <h2 className="text-[28px] md:text-[32px] font-extrabold text-[#191f28] tracking-tight mb-2">{zone.name}</h2>
              <p className="text-[15px] text-[#4e5968] leading-relaxed">{zone.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Apartment Grid */}
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-6">
        {zoneReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {zoneReports.map((report) => {
              const coverImage = (report.images && report.images.length > 0) ? report.images[0].url : 
                                  report.imageUrl || 
                                  report.sections?.infra?.gateImg || 
                                  report.sections?.infra?.landscapeImg || 
                                  report.sections?.ecosystem?.communityImg;
              const rating = report.rating || 5;

              return (
                <div key={report.id} onClick={() => setSelectedReport(report)} className="bg-white border shadow-sm border-[#e5e8eb] rounded-3xl overflow-hidden hover:border-[#3182f6]/50 hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col group">
                  {coverImage ? (
                    <div className="w-full h-[200px] shrink-0 bg-[#f2f4f6] relative overflow-hidden">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-[200px] shrink-0 bg-[#f2f4f6] flex items-center justify-center relative overflow-hidden">
                       <Camera size={32} className="text-[#d1d6db]" />
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col justify-between flex-1">
                     <div>
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="text-[18px] font-bold text-[#191f28] tracking-tight leading-snug line-clamp-1" title={report.apartmentName}>{report.apartmentName}</h3>
                         <div className="flex items-center text-[#ffc107] text-[12px] font-bold tracking-widest bg-black/5 px-2 py-0.5 rounded-full shrink-0 ml-2">
                           평점 {rating}점
                         </div>
                       </div>
                       <p className="text-[14px] text-[#4e5968] line-clamp-2 leading-relaxed h-[42px] mb-4">
                         {report.premiumContent || report.sections?.assessment?.alphaDriver || report.pros || '상세 리뷰가 접수되었습니다.'}
                       </p>
                     </div>
                     
                     <div className="flex justify-between items-center pt-4 border-t border-[#f2f4f6]">
                        <span className="text-[12px] font-bold text-[#8b95a1]">{report.author}</span>
                        <div className="flex items-center gap-3 text-[#8b95a1]">
                           <span className="text-[12px] font-bold">좋아요 {report.likes || 0}</span>
                           <span className="text-[12px] font-bold">댓글 {report.commentCount || 0}</span>
                        </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin size={48} className="text-[#d1d6db] mb-4" />
            <h3 className="text-[18px] font-bold text-[#191f28] mb-2">아직 등록된 리뷰가 없습니다</h3>
            <p className="text-[14px] text-[#8b95a1]">이 권역의 첫 임장기를 작성해보세요!</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <FieldReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          comments={commentsData[selectedReport.id] || []}
          commentInput={commentInput[selectedReport.id] || ''}
          onCommentChange={(text) => setCommentInput(prev => ({ ...prev, [selectedReport.id]: text }))}
          onSubmitComment={() => handleSubmitComment(selectedReport.id)}
          user={user}
        />
      )}
    </div>
  );
}
