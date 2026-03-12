'use client';

import { 
  Building, MapPin, Map as MapIcon, Info, Users, AlertCircle, ShieldAlert,
  Car, BookOpen, Clock, Tag, X, FileText, CheckCircle2, TrendingUp, Radar,
  MessageSquare, Heart, Compass, LayoutDashboard, Camera, UserCircle, Star, Maximize2, Link2, Trash2, Text, LogOut
} from 'lucide-react';
import MainChart from '@/components/MainChart';
import EduBubbleChart from '@/components/EduBubbleChart';
import LifestyleRadarChart from '@/components/LifestyleRadarChart';
import PropertyScoreChart from '@/components/consumer/PropertyScoreChart';
import { useDashboardData, dashboardFacade, CommentData, FieldReportData } from '@/lib/DashboardFacade';
import { ZONES, dongToZoneId, getZoneById, ZoneInfo } from '@/lib/zones';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export function FieldReportModal({ 
  report, 
  onClose,
  comments,
  commentInput,
  onCommentChange,
  onSubmitComment,
  user
}: { 
  report: FieldReportData;
  onClose: () => void;
  comments: CommentData[];
  commentInput: string;
  onCommentChange: (text: string) => void;
  onSubmitComment: () => void;
  user: User | null;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const s = report.sections;
  const coverImage = report.imageUrl || s?.infra?.gateImg || s?.infra?.landscapeImg || s?.ecosystem?.communityImg;
  const rating = report.rating || 5;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>

          {/* Hero Cover (Editorial Banner Layout) */}
          <div className="bg-white w-full flex flex-col md:flex-row p-8 md:p-12 pb-16 gap-8 md:gap-12 items-center rounded-t-3xl shrink-0 pt-4 md:pt-8 border-b border-[#e5e8eb]">
            
            {/* Left: Image (Constrained to prevent stretching) */}
            <div className="w-full md:w-[45%] lg:w-[40%] flex justify-center shrink-0">
              {coverImage ? (
                <div className="w-full max-w-[420px] aspect-video md:aspect-square bg-[#f2f4f6] rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                  <img src={coverImage} alt={report.apartmentName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full max-w-[420px] aspect-video md:aspect-square bg-[#f2f4f6] rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                   <span className="text-[#8b95a1] text-[14px] font-bold">등록된 대표 사진이 없습니다</span>
                </div>
              )}
            </div>

            {/* Right: Text Information */}
            <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col">
               <div className="flex items-center gap-2 mb-4">
                 <span className="bg-[#3182f6] text-white text-[13px] font-bold px-3 py-1 rounded-full">{report.apartmentName}</span>
                 <span className="bg-[#fff8e1] text-[#f59e0b] text-[13px] tracking-widest px-3 py-1 rounded-full font-bold shadow-sm border border-[#fde68a]">평점 {rating}점</span>
               </div>
               <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-extrabold leading-tight tracking-tight mb-6 md:mb-8 text-[#191f28]">{report.apartmentName}</h1>
               
               <div className="flex items-center gap-3 pt-6 border-t border-[#e5e8eb] text-[#4e5968]">
                 <span className="text-[14px] font-bold">{report.author}</span>
                 <span className="text-[13px] opacity-60">·</span>
                 <span className="text-[13px]">{report.createdAt}</span>
               </div>
            </div>

          </div>

          {/* Magazine Content Wrapper */}
          <div className="px-6 py-8 md:p-12 flex flex-col gap-10 max-w-[1000px] mx-auto w-full">

            {/* 0. Premium Score Analysis (If Available, outside of legacy toggle) */}
            {report.premiumScores && (
              <div className="mb-2">
                 <PropertyScoreChart scores={report.premiumScores} />
              </div>
            )}

            {/* New Schema (Premium CMS): Render dynamic images if available */}
            {report.images && report.images.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                 <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                   <Camera size={20} className="text-[#3182f6]"/> 현장 프리미엄 사진 브리핑
                 </h2>
                 <div className="flex flex-col gap-12">
                   {report.images.map((img, i) => (
                     <div key={i} className="flex flex-col md:flex-row gap-8 pt-8 first:pt-0 first:border-0 border-t border-[#f2f4f6]">
                       <div 
                         className="w-full md:w-[400px] lg:w-[480px] h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group relative shadow-sm"
                         onClick={() => setFullscreenImage(img.url)}
                       >
                         <img src={img.url} alt={img.locationTag} className="w-full h-full object-cover bg-[#f2f4f6] group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                           <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                         </div>
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-4">
                           <h4 className="text-[16px] font-bold text-[#191f28] bg-[#f8f9fa] border border-[#e5e8eb] px-4 py-1.5 rounded-lg">
                             {img.locationTag}
                           </h4>
                           {img.isPremium && (
                             <span className="text-[10px] font-bold bg-[#191f28] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                               <Star size={10} className="fill-[#ffc107] text-[#ffc107]" /> PREMIUM
                             </span>
                           )}
                         </div>
                         <p className="text-[16px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{img.caption || '상세 설명이 등록되지 않았습니다.'}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {!s ? (
              // Legacy Template Render (Fallback if both schemas are empty)
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                 <h2 className="text-[20px] font-bold text-[#191f28] mb-6 border-b border-[#e5e8eb] pb-3">단지 요약 정보</h2>
                 <div className="flex flex-col gap-4">
                   {(report.pros || report.premiumContent) ? (
                     <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#bbf7d0]">
                       <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 주요 내용 및 총평</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{report.premiumContent || report.pros}</p>
                     </div>
                   ) : (
                     <p className="text-[#8b95a1] text-[15px]">데이터가 준비되지 않았습니다.</p>
                   )}
                 </div>
              </div>
            ) : (
              // Advanced Template Render
              <>
                {/* 1. 요약 브리프 (Assessment: Alpha / Risk) */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Text size={20} className="text-[#3182f6]"/> 요약 브리프</h2>
                   <div className="flex flex-col gap-4">
                     <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#bbf7d0]">
                       <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 이 단지만의 강력한 장점 (Alpha Driver)</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.alphaDriver || '내용 없음'}</p>
                     </div>
                     <div className="bg-[#fff5f5] p-5 rounded-2xl border border-[#ffebec]">
                       <h3 className="text-[15px] font-extrabold text-[#f04452] mb-2 flex items-center gap-1.5"><AlertCircle size={18}/> 아쉬운 단점과 위험 (Vulnerability)</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.systemicRisk || '내용 없음'}</p>
                     </div>
                   </div>
                </div>

                {/* 2. 단지 기본 명세 (Specs) */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Building size={20} className="text-[#3182f6]"/> 단지 기본 명세</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">준공 연월 / 연차</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.builtYear || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">규모 (세대/동)</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.scale || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">용적률 / 건폐율</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.farBuild || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">세대당 주차 (지하%)</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.parkingRatio || '-'}</p>
                      </div>
                   </div>
                </div>

                {/* 3. 물리적 인프라 & 조경 */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Camera size={20} className="text-[#3182f6]"/> 현장 인프라 둘러보기</h2>
                   <div className="flex flex-col gap-8">
                      {/* Gate */}
                      {(s.infra.gateText || s.infra.gateImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.infra.gateImg && <img src={s.infra.gateImg} alt="진입로/문주" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">진입로 및 정문</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.gateText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Landscaping */}
                      {(s.infra.landscapeText || s.infra.landscapeImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.landscapeImg && <img src={s.infra.landscapeImg} alt="조경/지형" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">단지 조경 및 지형</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.landscapeText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Parking & Maintenance ... (Skip strict layout for brevity, just render them similarly) */}
                       {(s.infra.parkingText || s.infra.parkingImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.parkingImg && <img src={s.infra.parkingImg} alt="지하주차장" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">지하주차장 인프라</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.parkingText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 4. Ecosystem */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Info size={20} className="text-[#3182f6]"/> 생활 편의시설 및 거시 입지</h2>
                   <div className="flex flex-col gap-8">
                      {(s.ecosystem.schoolText || s.ecosystem.schoolImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.ecosystem.schoolImg && <img src={s.ecosystem.schoolImg} alt="학군" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">학군 및 통학로</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.schoolText}</p>
                          </div>
                        </div>
                      )}
                      {(s.ecosystem.commerceText || s.ecosystem.commerceImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.ecosystem.commerceImg && <img src={s.ecosystem.commerceImg} alt="상권" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">동네 상권</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.commerceText}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 5. Synthesis */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><ShieldAlert size={20} className="text-[#3182f6]"/> 최종 매수 타당성 평가</h2>
                   <div className="flex flex-col gap-4">
                      <div className="bg-[#191f28] p-6 rounded-2xl text-white">
                        <h4 className="text-[13px] font-bold text-[#8b95a1] mb-2">교통 및 개발 호재</h4>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4 pb-4 border-b border-white/10">{s.location.trafficText || '-'}</p>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{s.location.developmentText || '-'}</p>
                      </div>
                      <div className="p-6 rounded-2xl border-2 border-[#191f28] bg-[#fdfdfd]">
                        <h4 className="text-[16px] font-extrabold text-[#191f28] mb-2">💡 최종 결론 (Synthesis)</h4>
                        <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.assessment.synthesis || '-'}</p>
                        
                        {s.assessment.probability && (
                          <div className="mt-6 p-4 bg-[#e8f3ff] rounded-xl flex items-start gap-3">
                             <Radar size={20} className="text-[#3182f6] shrink-0 mt-0.5" />
                             <div>
                               <h5 className="text-[13px] font-bold text-[#3182f6] mb-1">상승 확률 모델링</h5>
                               <p className="text-[14px] text-[#191f28] leading-snug">{s.assessment.probability}</p>
                             </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                <MessageSquare size={20} className="text-[#3182f6]"/> 
                이웃들의 이야기 <span className="text-[#3182f6] text-[16px] ml-1">{comments.length}</span>
              </h2>
              
              <div className="flex flex-col gap-6">
                {/* Input Area */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={user ? "임장기에 대한 생각이나 궁금한 점을 남겨주세요." : "로그인 후 댓글을 남길 수 있습니다."}
                    disabled={!user}
                    className="flex-1 border border-[#e5e8eb] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 focus:border-[#3182f6] disabled:bg-[#f2f4f6]"
                    value={commentInput}
                    onChange={(e) => onCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSubmitComment();
                    }}
                  />
                  <button 
                    onClick={onSubmitComment}
                    disabled={!user || !commentInput.trim()}
                    className="bg-[#3182f6] text-white px-5 rounded-xl font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    등록
                  </button>
                </div>

                {/* Comment List */}
                <div className="flex flex-col gap-4 mt-2">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3 bg-[#f9fafb] p-4 rounded-2xl border border-[#e5e8eb]">
                        <div className="w-8 h-8 rounded-full bg-white border border-[#e5e8eb] shadow-sm flex items-center justify-center shrink-0">
                           <UserCircle size={16} className="text-[#8b95a1]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-[14px] text-[#191f28]">{comment.author}</span>
                            <span className="text-[12px] text-[#8b95a1]">{comment.createdAt}</span>
                          </div>
                          <p className="text-[14px] text-[#4e5968] leading-relaxed break-all whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-[#8b95a1] text-[14px]">
                      아직 작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen view" 
            className="max-w-[95vw] max-h-[95vh] object-contain select-none shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { kpis, newsFeed, fieldReports, dongtanApartments, adBanner } = useDashboardData();
  const [isWriting, setIsWriting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('교통');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  
  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [anonProfile, setAnonProfile] = useState<{nickname: string} | null>(null);

  // (Optional) Image State - For when storage is unpaused
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create their anonymous profile immediately upon login
        const profile = await dashboardFacade.getUserProfile(currentUser.uid);
        setAnonProfile(profile);
      } else {
        setAnonProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleOpenWriteModal = () => {
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      handleLogin();
      return;
    }
    setIsWriting(true);
  };

  const handleLikeClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!user) { alert("로그인 후 좋아요를 누를 수 있습니다!"); return; }
    dashboardFacade.incrementLike(postId);
  };

  const handleReportLikeClick = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!user) { alert("로그인 후 좋아요를 누를 수 있습니다!"); return; }
    dashboardFacade.incrementFieldReportLike(reportId);
  };

  const handleToggleComments = (reportId: string) => {
    const isExpanding = !expandedComments[reportId];
    setExpandedComments(prev => ({ ...prev, [reportId]: isExpanding }));

    if (isExpanding && !commentsData[reportId]) {
      // Subscribe to comments
      dashboardFacade.listenToComments(reportId, (comments) => {
        setCommentsData(prev => ({ ...prev, [reportId]: comments }));
      });
    }
  };

  const handleSubmitComment = async (reportId: string) => {
    if (!user) { alert("로그인 후 댓글을 남길 수 있습니다."); handleLogin(); return; }
    const text = commentInput[reportId];
    if (!text?.trim()) return;

    await dashboardFacade.addFieldReportComment(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim() || !user) return;
    setIsSubmitting(true);
    await dashboardFacade.addPost(postTitle, postCategory, user.uid, imageFile || undefined);
    setPostTitle('');
    setImageFile(null);
    setIsWriting(false);
    setIsSubmitting(false);
  };

  // Fetch comments automatically when a report modal is opened
  useEffect(() => {
    if (selectedReport && !commentsData[selectedReport.id]) {
      const unsubscribe = dashboardFacade.listenToComments(selectedReport.id, (comments) => {
        setCommentsData(prev => ({ ...prev, [selectedReport.id]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport]);

  // Count field reports by zone (for display counts)
  const zoneReportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ZONES.forEach(z => { counts[z.id] = 0; });
    fieldReports?.forEach(report => {
      const zoneId = dongToZoneId(report.dong);
      counts[zoneId] = (counts[zoneId] || 0) + 1;
    });
    return counts;
  }, [fieldReports]);

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans selection:bg-[#3182f6]/20">
      
      {/* Top Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8eb] sticky top-0 z-40 transition-all duration-300">
        <div className="w-full max-w-[2000px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 h-16 flex justify-between items-center">
          <h1 className="text-[18px] md:text-xl font-extrabold tracking-tight text-[#191f28]">
            동탄 인사이드
          </h1>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full pl-3 pr-4 py-1.5 shadow-sm">
                <button onClick={() => router.push('/lounge')} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#3182f6]">
                    <UserCircle size={14} />
                  </div>
                  <span className="text-[12px] font-bold text-[#191f28] hidden sm:inline">{anonProfile?.nickname || user.displayName || user.email?.split('@')[0] || '사용자'}</span>
                </button>
                {dashboardFacade.isAdmin(user.email) && (
                  <button 
                    onClick={() => router.push('/admin')}
                    className="ml-1 bg-[#191f28] text-white px-3 py-1 rounded-lg text-[12px] font-bold transition-colors">
                    관리자
                  </button>
                )}
                <button onClick={handleLogout} className="ml-1 sm:ml-2 bg-[#ffebec] text-[#f04452] hover:bg-[#f04452] hover:text-white px-3 py-1 rounded-lg text-[12px] font-bold transition-colors">
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-1.5 bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#191f28] text-[13px] font-bold py-1.5 px-4 rounded-xl transition-colors">
                 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 py-8 md:py-12 animate-in fade-in duration-500">
        
        {/* 1. 🔥 Hi-Fi Local Data: Field Reports (Zone-based Navigation) */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">
                발로 뛴 리얼 임장기
              </h2>
              <p className="text-[15px] text-[#8b95a1] font-medium">동탄2신도시 7대 투자 권역별 아파트 현장 리뷰</p>
            </div>
          </div>


          {/* Zone Selection View (Horizontal Slider) */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 md:-mx-12 md:px-12 lg:mx-0 lg:px-0 lg:overflow-visible lg:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {ZONES.map(zone => {
              const count = zoneReportCounts[zone.id] || 0;

              return (
                <div 
                  key={zone.id}
                  onClick={() => router.push(`/zone/${zone.id}`)}
                  className="bg-white border border-[#e5e8eb] rounded-3xl overflow-hidden hover:border-[#3182f6]/50 hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300 group snap-start shrink-0 w-[260px] md:w-[280px] lg:w-auto lg:shrink lg:flex-1 lg:min-w-0"
                >
                  <div className="w-full h-[160px] bg-[#f2f4f6] relative overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${zone.color}15, ${zone.color}30)` }}>
                      <MapPin size={32} className="text-[#d1d6db]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: zone.color, color: 'white' }}>{zone.dongLabel}</span>
                      </div>
                      <h3 className="text-white text-[17px] font-extrabold tracking-tight drop-shadow-md leading-snug">{zone.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[12px] text-[#4e5968] leading-relaxed line-clamp-2 mb-3">{zone.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#8b95a1] font-bold">{count}개 단지 리뷰</span>
                      <span className="text-[13px] font-bold" style={{ color: zone.color }}>보기 →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Bottom Split Layout: News Feed & Other Info */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* General News Feed List */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#e5e8eb] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">실시간 동탄라운지</h2>
              <button onClick={() => router.push('/lounge')} className="text-[#3182f6] text-[14px] font-bold hover:underline">몽땅 보기 &gt;</button>
            </div>
            <ul className="flex flex-col gap-1">
              {newsFeed.slice(0, 5).map((news) => (
                <li key={news.id} className="flex gap-4 items-center py-4 border-b border-[#f2f4f6] last:border-0 hover:bg-[#f9fafb] px-3 -mx-3 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex-1 w-full">
                    <h4 className="text-[15px] leading-snug mb-1 font-bold text-[#191f28] line-clamp-1">{news.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#8b95a1]">{news.author} · {news.meta}</span>
                       <div className="flex items-center gap-1.5 text-[#4e5968]">
                          <span className="text-[12px] font-bold">좋아요 {news.likes || 0}</span>
                       </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Secondary Ad / Promo Space */}
          <div className="flex flex-col gap-6">
             <div className="w-full h-[200px] bg-gradient-to-br from-[#3182f6] to-[#2b72d6] rounded-3xl p-8 flex flex-col justify-end text-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-white/20 transition-colors"></div>
               <h3 className="text-[24px] font-extrabold mb-1 relative z-10">우리 아파트 탈탈 털어드림!</h3>
               <p className="text-white/80 text-[14px] relative z-10">장점부터 숨기고 싶은 단점까지 속 시원하게 분석 신청하기</p>
               <div className="absolute top-8 right-8 bg-white text-[#3182f6] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-black/10">
                 &rarr;
               </div>
             </div>
             
             {/* 신혼부부 첫 집 추천 */}
             {kpis.filter(k => k.title === '신혼부부 첫 집 추천').map(kpi => (
               <div key={kpi.id} className="w-full flex-1 bg-white p-6 rounded-3xl border border-[#e5e8eb] shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h3 className="text-[13px] text-[#4e5968] font-bold mb-3">{kpi.title}</h3>
                  <div className="text-[24px] font-extrabold text-[#191f28]">{kpi.mainValue}</div>
                  {kpi.subValue && <p className="text-[12px] text-[#8b95a1] font-medium mt-1">{kpi.subValue}</p>}
               </div>
             ))}
          </div>
        </section>
        


        {/* 4. Ad Banner Placeholder */}
        <div className="w-full bg-[#f2f4f6] border border-[#e5e8eb] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
           <span className="bg-[#191f28] text-white text-[11px] font-bold px-2 py-0.5 rounded mb-2">AD</span>
           <h3 className="text-[18px] font-bold text-[#191f28] mb-1">여기에 광고 배너가 표시됩니다</h3>
           <p className="text-[#8b95a1] text-[14px]">광고 구좌 (e.g., 부동산 플랫폼 배너, 인테리어 광고 등)</p>
        </div>
        
      </main>

      {/* Field Report Full View Modal */}
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
