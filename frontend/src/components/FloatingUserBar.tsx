'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { dashboardFacade } from '@/lib/DashboardFacade';
import { isAdmin } from '@/lib/config/admin.config';
import { UserCircle, Edit3, X, Camera, Moon, Sun } from 'lucide-react';
import { uploadImage } from '@/lib/services/reportService';

export default function FloatingUserBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [anonProfile, setAnonProfile] = useState<{nickname: string; frontName?: string; photoURL?: string} | null>(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editFrontName, setEditFrontName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await dashboardFacade.getUserProfile(currentUser.uid);
        if (profile) setAnonProfile(profile);
        if (isAdmin(currentUser.email)) {
          localStorage.setItem('dview_is_admin', 'true');
        } else {
          localStorage.removeItem('dview_is_admin');
        }
      } else {
        setAnonProfile(null);
        localStorage.removeItem('dview_is_admin');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (err) { console.error('Login failed:', err); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (err) { console.error('Logout failed:', err); }
  };

  return (
    <>
      {/* User Bar — Embeddable */}
      <div className="animate-in fade-in duration-300 flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 sm:p-2 rounded-full bg-surface border border-border shadow-sm text-secondary hover:opacity-80 transition-opacity"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2 bg-surface/90 rounded-full pl-2 sm:pl-3 pr-2 sm:pr-4 py-1 sm:py-1.5 border border-border shadow-sm">
            <button onClick={() => {
              setEditFrontName(anonProfile?.frontName || '동탄사는');
              setEditNickname(anonProfile?.nickname || '');
              setProfilePhotoPreview(anonProfile?.photoURL || null);
              setProfilePhotoFile(null);
              setShowProfileModal(true);
            }} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-toss-blue-light dark:bg-toss-blue-light/20 flex items-center justify-center text-toss-blue overflow-hidden border border-toss-blue/20">
                {(anonProfile?.photoURL || user.photoURL) ? (
                  <img src={anonProfile?.photoURL || user.photoURL || ''} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-extrabold">
                    {(anonProfile?.nickname || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-bold text-primary hidden sm:inline tracking-tight">
                {anonProfile?.nickname || user.displayName || user.email?.split('@')[0] || '사용자'}
              </span>
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="flex items-center gap-1.5 bg-surface text-primary text-[11px] sm:text-[13px] font-bold py-1 sm:py-2 px-3 sm:px-5 rounded-full border border-border shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            로그인
          </button>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && user && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="relative bg-surface rounded-3xl p-8 w-full max-w-[420px] shadow-2xl">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-tertiary hover:text-primary p-1 rounded-full transition-colors">
              <X size={18} />
            </button>

            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer mb-3" onClick={() => document.getElementById('floating-profile-photo-input')?.click()}>
                <div className="w-20 h-20 rounded-full bg-toss-blue-light flex items-center justify-center overflow-hidden ring-4 ring-toss-blue-light">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={40} className="text-toss-blue" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-surface" />
                </div>
                <input
                  id="floating-profile-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfilePhotoFile(file);
                      setProfilePhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <h3 className="text-[18px] font-extrabold text-primary">프로필 수정</h3>
              <p className="text-[13px] text-tertiary mt-1">{user.email}</p>
            </div>

            {/* Nickname Preview */}
            <div className="bg-body border border-border rounded-2xl p-4 mb-5 text-center">
              <p className="text-[11px] text-tertiary font-bold mb-1.5">다른 사용자에게 보이는 이름</p>
              <p className="text-[22px] font-extrabold text-primary tracking-wide">
                <span className="text-toss-blue">{editFrontName}</span> {editNickname}
              </p>
              <p className="text-[11px] text-tertiary mt-1">총 {editFrontName.length + editNickname.length}/7글자</p>
            </div>

            <div className="space-y-4">
              {/* FrontName (4자) */}
              <div>
                <label className="text-[12px] font-bold text-secondary mb-1.5 flex items-center justify-between">
                  <span>프론트 네임 (4글자)</span>
                  <span className={`text-[11px] ${editFrontName.length === 4 ? 'text-toss-green' : 'text-toss-red'}`}>{editFrontName.length}/4</span>
                </label>
                <input
                  type="text"
                  value={editFrontName}
                  onChange={(e) => { if (e.target.value.length <= 4) setEditFrontName(e.target.value); }}
                  className="w-full px-4 py-3 bg-body border border-border rounded-xl text-[15px] font-bold text-primary focus:ring-2 focus:ring-toss-blue/20 focus:border-toss-blue outline-none text-center tracking-widest"
                  placeholder="동탄사는"
                  maxLength={4}
                />
              </div>

              {/* Nickname (3자) */}
              <div>
                <label className="text-[12px] font-bold text-secondary mb-1.5 flex items-center justify-between">
                  <span>닉네임 (3글자)</span>
                  <span className={`text-[11px] ${editNickname.length === 3 ? 'text-toss-green' : 'text-toss-red'}`}>{editNickname.length}/3</span>
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => { if (e.target.value.length <= 3) setEditNickname(e.target.value); }}
                  className="w-full px-4 py-3 bg-body border border-border rounded-xl text-[15px] font-bold text-primary focus:ring-2 focus:ring-toss-blue/20 focus:border-toss-blue outline-none text-center tracking-widest"
                  placeholder="랑독이"
                  maxLength={3}
                />
              </div>

              
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (editFrontName.length !== 4 || editNickname.length !== 3) {
                      alert('프론트 네임 4글자, 닉네임 3글자를 정확히 입력해주세요.');
                      return;
                    }
                    setIsSavingProfile(true);
                    try {
                      let photoURL = anonProfile?.photoURL;
                      if (profilePhotoFile) {
                        photoURL = await uploadImage(profilePhotoFile, `profiles/${user.uid}`);
                        await dashboardFacade.updatePhotoURL(user.uid, photoURL);
                      }
                      await dashboardFacade.updateFrontName(user.uid, editFrontName);
                      await dashboardFacade.updateNickname(user.uid, editNickname);
                      setAnonProfile({ frontName: editFrontName, nickname: editNickname, photoURL });
                      setShowProfileModal(false);
                    } catch (err) {
                      console.error('Profile update failed:', err);
                      alert('프로필 수정에 실패했습니다.');
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                  disabled={isSavingProfile || editFrontName.length !== 4 || editNickname.length !== 3}
                  className="flex-1 py-3 bg-toss-blue hover:bg-[#2b72d6] text-surface font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '저장하기'
                  )}
                </button>
                {dashboardFacade.isAdmin(user.email) && (
                  <button 
                    onClick={() => { setShowProfileModal(false); router.push('/admin'); }}
                    className="flex-1 py-3 bg-primary hover:bg-black text-surface font-bold text-[14px] rounded-xl transition-colors"
                  >
                    관리자 설정
                  </button>
                )}
                <button 
                  onClick={() => { setShowProfileModal(false); handleLogout(); }}
                  className="flex-1 py-3 bg-[#ffebec] hover:bg-toss-red text-toss-red hover:text-surface font-bold text-[14px] rounded-xl transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
