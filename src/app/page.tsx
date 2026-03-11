'use client';

import { BookOpen, Radar, RefreshCw, X, Heart, UserCircle, LogOut, MapPin, Text, MessageSquare, Star, Camera, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import MainChart from '@/components/MainChart';
import EduBubbleChart from '@/components/EduBubbleChart';
import LifestyleRadarChart from '@/components/LifestyleRadarChart';
import { useDashboardData, dashboardFacade, CommentData } from '@/lib/DashboardFacade';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function Dashboard() {
  const router = useRouter();
  const { kpis, newsFeed, fieldReports, dongtanApartments, adBanner } = useDashboardData();
  const [isWriting, setIsWriting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('교통');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  return (
    <div className="animate-in fade-in duration-300 relative">
      
      {/* Top Header & Auth Area */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#191f28]">DTDLS 동탄 인텔리전스</h1>
        <div className="flex items-center gap-3">
          {user && anonProfile ? (
            <div className="flex items-center gap-2 bg-white border border-[#e5e8eb] rounded-full pl-3 pr-4 py-1.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#8b95a1]">
                <UserCircle size={16} />
              </div>
              <span className="text-[13px] font-semibold text-[#191f28]">{anonProfile.nickname} <span className="text-[11px] text-[#8b95a1] ml-0.5 font-normal">(Me)</span></span>
              <button onClick={handleLogout} className="ml-2 text-[#8b95a1] hover:text-[#f04452] transition-colors"><LogOut size={16} /></button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#191f28] text-[14px] font-semibold py-2 px-4 rounded-xl transition-colors">
              <UserCircle size={18} /> 로그인
            </button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className={`toss-card flex flex-col justify-between gap-3 ${kpi.gradientBackground ? `bg-gradient-to-br ${kpi.gradientBackground}` : ''} ${kpi.borderColor ? `border ${kpi.borderColor}` : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm ${kpi.titleColor} font-bold flex items-center gap-1.5 mb-1`}>
                  <kpi.icon size={16} /> {kpi.title}
                </h3>
                <p className="text-[13px] text-[#4e5968]">{kpi.subtitle}</p>
              </div>
              {kpi.badgeText && (
                <div className={`${kpi.badgeStyle} text-[11px] font-bold px-2 py-0.5 rounded-full`}>
                  {kpi.badgeText}
                </div>
              )}
            </div>
            <div>
              <div className="text-[26px] font-bold tracking-tight text-[#191f28] flex items-baseline gap-1.5">
                {kpi.mainValue}
                {kpi.subValue}
              </div>
              {typeof kpi.description === 'string' ? (
                <p className="text-[12px] text-[#8b95a1] mt-0.5">{kpi.description}</p>
              ) : (
                kpi.description
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 Hi-Fi Local Data: Field Reports (Hero Content) */}
      <div className="mb-8 relative">
        <div className="flex justify-between items-end mb-6 px-1 border-b-2 border-[#191f28] pb-3">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] flex items-center gap-2 mb-1">
              🔥 동탄 실시간 임장기
            </h2>
            <p className="text-[14px] text-[#4e5968] font-medium">관리자가 직접 발로 뛰어 수집한 고품질 하이퍼 로컬 데이터입니다.</p>
          </div>
          {user && dashboardFacade.isAdmin(user.email) && (
            <button 
              onClick={() => {
                router.push('/write-report');
              }}
              className="bg-[#3182f6] hover:bg-[#1b64da] text-white text-[14px] font-bold py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2">
              <Camera size={18} /> 새 임장기 작성 
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {fieldReports?.map((report) => (
             <div key={report.id} className="bg-white border shadow-md border-[#e5e8eb] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {report.imageUrl && (
                    <div className="w-full aspect-[4/3] bg-[#f2f4f6] relative overflow-hidden">
                      <img src={report.imageUrl} alt="Field Report" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                         <div className="bg-black/60 backdrop-blur-md text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                           <MapPin size={14} className="text-[#3182f6]"/> {report.apartmentName}
                         </div>
                         <div className="flex items-center text-[#ffc107] text-[15px] tracking-widest bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                           {'⭐'.repeat(report.rating)}
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {!report.imageUrl && (
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#f2f4f6]">
                        <h3 className="text-[22px] font-bold text-[#191f28] tracking-tight">{report.apartmentName}</h3>
                        <div className="flex items-center text-[#ffc107] text-[16px] tracking-widest">
                          {'⭐'.repeat(report.rating)}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3 mb-6 space-y-1">
                      <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-[#bbf7d0]/50">
                        <p className="text-[13px] font-extrabold text-[#03c75a] mb-1 flex items-center gap-1"><CheckCircle2 size={16}/> 최고의 장점</p>
                        <p className="text-[15px] leading-relaxed text-[#191f28]">{report.pros}</p>
                      </div>
                      <div className="bg-[#fff5f5] p-4 rounded-2xl border border-[#ffebec]/50">
                        <p className="text-[13px] font-extrabold text-[#f04452] mb-1 flex items-center gap-1"><AlertCircle size={16}/> 아쉬운 점</p>
                        <p className="text-[15px] leading-relaxed text-[#191f28]">{report.cons}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#f2f4f6] rounded-full flex items-center justify-center border border-[#e5e8eb] shadow-sm"><UserCircle size={14} className="text-[#8b95a1]"/></div>
                      <span className="text-[13px] font-bold text-[#4e5968]">{report.author}</span>
                      <span className="text-[12px] text-[#b0b8c1] ml-1 flex items-center gap-1"><Clock size={12}/> {report.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions: Likes & Comments */}
                  <div className="flex items-center gap-2 pt-4 border-t border-[#f2f4f6]">
                    <button 
                      onClick={(e) => handleReportLikeClick(e, report.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-bold text-[#4e5968] hover:text-[#f04452] bg-[#f9fafb] hover:bg-[#fff5f5] py-2.5 rounded-xl transition-colors border border-transparent hover:border-[#ffebec]"
                    >
                       <Heart size={16} className={report.likes ? "fill-[#f04452] text-[#f04452]" : ""} /> 도움돼요 {report.likes || 0}
                    </button>
                    <button 
                      onClick={() => handleToggleComments(report.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-bold text-[#4e5968] hover:text-[#3182f6] bg-[#f9fafb] hover:bg-[#e8f3ff] py-2.5 rounded-xl transition-colors border border-transparent hover:border-[#bfdbfe]"
                    >
                       <MessageSquare size={16} /> 댓글 {report.commentCount || 0}
                    </button>
                  </div>

                  {/* Expandable Comments Section */}
                  {expandedComments[report.id] && (
                    <div className="mt-5 pt-5 border-t border-dashed border-[#d1d6db] bg-[#f9fafb] -mx-6 -mb-6 px-6 pb-6 rounded-b-3xl">
                       <h4 className="text-[14px] font-bold text-[#191f28] mb-4 flex items-center gap-1.5"><MessageSquare size={16} className="text-[#3182f6]"/> 댓 반응</h4>
                       
                       <div className="flex flex-col gap-3 mb-5 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                         {commentsData[report.id]?.length > 0 ? (
                           commentsData[report.id].map(comment => (
                             <div key={comment.id} className="flex flex-col bg-white p-4 rounded-2xl border border-[#e5e8eb] shadow-sm">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[13px] font-bold text-[#3182f6]">{comment.author}</span>
                                  <span className="text-[11px] text-[#8b95a1]">{comment.createdAt}</span>
                                </div>
                                <p className="text-[14px] text-[#191f28] leading-relaxed">{comment.text}</p>
                             </div>
                           ))
                         ) : (
                           <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-[#d1d6db]">
                             <p className="text-[13px] text-[#8b95a1]">아직 댓글이 없습니다.<br/>첫 댓글을 남겨보세요!</p>
                           </div>
                         )}
                       </div>

                       <div className="flex items-center gap-2">
                         <input 
                           type="text" 
                           placeholder="단지 정보나 궁금한 점을 남겨주세요." 
                           value={commentInput[report.id] || ''}
                           onChange={(e) => setCommentInput(prev => ({ ...prev, [report.id]: e.target.value }))}
                           onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(report.id)}
                           className="flex-1 bg-white border border-[#d1d6db] text-[14px] px-4 py-3 rounded-xl outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 transition-all"
                         />
                         <button 
                           onClick={() => handleSubmitComment(report.id)}
                           className="bg-[#3182f6] text-white font-bold text-[14px] px-5 py-3 rounded-xl hover:bg-[#1b64da] transition-colors shadow-sm active:scale-95"
                         >게시</button>
                       </div>
                    </div>
                  )}

                </div>
             </div>
           ))}
        </div>
      </div>

      {/* General News & Issues Feed */}
      <div className="toss-card flex flex-col mb-6 relative">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">실시간 지역 소식</h2>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleOpenWriteModal}
               className="bg-[#3182f6] hover:bg-[#1b64da] text-white text-[14px] font-semibold py-1.5 px-4 rounded-lg transition-colors shadow-sm">
                글쓰기
             </button>
             <button className="icon-btn"><RefreshCw size={20} /></button>
          </div>
        </div>

        {/* --- Write Post Inline UI --- */}
        {isWriting && (
          <div className="bg-[#f2f4f6] rounded-xl p-4 mb-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#191f28]">새 소식 전하기</h3>
              <button onClick={() => setIsWriting(false)} className="text-[#8b95a1] hover:text-[#191f28]">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-3 items-center mb-3">
              <select 
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="bg-white border border-[#d1d6db] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#3182f6]"
              >
                <option value="교통">교통 (🚆)</option>
                <option value="부동산">부동산 (🏢)</option>
                <option value="교육">교육 (📚)</option>
                <option value="문화">문화 (📅)</option>
              </select>
              <input 
                type="text" 
                placeholder="동탄 지역에 어떤 일이 있나요?"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="flex-1 bg-white border border-[#d1d6db] rounded-lg px-4 py-2 text-[14px] outline-none focus:border-[#3182f6]"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSubmitPost}
                disabled={isSubmitting || !postTitle.trim()}
                className="bg-[#191f28] hover:bg-black text-white text-[13px] font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        )}

        <ul className="flex flex-col">
          {newsFeed.map((news) => (
            <li key={news.id} className="flex gap-4 items-start py-4 border-b last:border-0 border-[#f2f4f6] hover:bg-[#f9fafb] -mx-4 px-4 rounded-lg cursor-pointer transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 ${news.tagClass} relative -top-1`}>
                <news.icon size={20} />
              </div>
              <div className="flex-1 w-full flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-[15px] leading-relaxed mb-1 font-semibold text-[#191f28] group-hover:text-[#3182f6] transition-colors">{news.title}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-bold text-[#4e5968] bg-[#f2f4f6] px-1.5 py-0.5 rounded">{news.author}</span>
                    <span className="text-[12px] text-[#8b95a1]">{news.meta}</span>
                  </div>
                  {news.imageUrl && (
                    <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-[#f2f4f6]">
                      <img src={news.imageUrl} alt="post image" className="w-full h-auto object-cover max-h-48" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => handleLikeClick(e, news.id)}
                  className="flex items-center justify-center gap-1.5 text-[#8b95a1] hover:text-[#f04452] transition-colors shrink-0 bg-white border border-[#f2f4f6] rounded-full px-3 py-1.5 shadow-sm group-hover:border-[#f04452]/30 active:scale-95 duration-200"
                >
                  <Heart size={14} className={news.likes ? "fill-[#f04452] text-[#f04452]" : ""} />
                  <span className="text-[12px] font-bold tracking-tight">{news.likes || 0}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>



      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart Section */}
        <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[480px] lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">부동산 매매/전월세 거래량 추이</h2>
            <button className="btn-outline">자세히 보기</button>
          </div>
          <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center relative overflow-hidden">
            <MainChart />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Edu Bubble Chart */}
          <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[228px]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">에듀 랩스: 권역별 학원 밀집도</h2>
              <button className="icon-btn"><BookOpen size={20} /></button>
            </div>
            <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center overflow-hidden">
              <EduBubbleChart />
            </div>
          </div>

          {/* Lifestyle Radar Chart */}
          <div className="toss-card flex flex-col min-h-[400px] lg:min-h-[228px]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[20px] font-bold tracking-tight text-[#191f28]">라이프스타일: 상권 혼잡도</h2>
              <button className="icon-btn"><Radar size={20} /></button>
            </div>
            <div className="flex-1 w-full bg-[#f9fafb] rounded-xl border border-dashed border-transparent flex items-center justify-center overflow-hidden">
              <LifestyleRadarChart />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Ad Banner */}
      <div className="relative bg-[#e8f3ff] flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:px-8 md:py-6 rounded-2xl gap-4">
        <p className="absolute top-4 right-6 bg-black/5 text-[#3182f6] text-[10px] py-1 px-1.5 rounded font-bold">AD</p>
        <div>
          <h2 className="text-[20px] font-bold text-[#191f28] mb-1 tracking-tight pr-10">{adBanner.title}</h2>
          <p className="text-[#4e5968] text-[15px]">{adBanner.description}</p>
        </div>
        <button className="btn-primary w-full md:w-auto shrink-0 px-6 rounded-xl">{adBanner.buttonText}</button>
      </div>
    </div>
  );
}
