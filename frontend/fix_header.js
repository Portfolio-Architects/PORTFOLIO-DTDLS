const fs = require('fs');

// 1. Update FloatingUserBar.tsx
let userBar = fs.readFileSync('src/components/FloatingUserBar.tsx', 'utf-8');

// Remove Admin and Logout from the outer pills:
userBar = userBar.replace(
  /\{dashboardFacade\.isAdmin\(user\.email\) && \(\r?\n\s*<button[\s\S]*?<\/button>\r?\n\s*\)\}\r?\n\s*<button onClick=\{handleLogout\}[\s\S]*?<\/button>\r?\n/m,
  ''
);

// Add them inside the Profile Edit Modal at the bottom:
const modalButtons = `
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
                        photoURL = await uploadImage(profilePhotoFile, \`profiles/\${user.uid}\`);
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
                  className="flex-1 py-3 bg-[#3182f6] hover:bg-[#2b72d6] text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    className="flex-1 py-3 bg-[#191f28] hover:bg-black text-white font-bold text-[14px] rounded-xl transition-colors"
                  >
                    관리자 설정
                  </button>
                )}
                <button 
                  onClick={() => { setShowProfileModal(false); handleLogout(); }}
                  className="flex-1 py-3 bg-[#ffebec] hover:bg-[#f04452] text-[#f04452] hover:text-white font-bold text-[14px] rounded-xl transition-colors"
                >
                  로그아웃
                </button>
              </div>`;

userBar = userBar.replace(
  /<button\r?\n\s*onClick=\{async \(\) => \{\r?\n\s*if \(editFrontName\.length[\s\S]*?<\/button>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\)\}/m,
  modalButtons + '\n            </div>\n          </div>\n        </div>\n      )}'
);
fs.writeFileSync('src/components/FloatingUserBar.tsx', userBar);


// 2. Update DashboardClient.tsx
let dashboard = fs.readFileSync('src/components/DashboardClient.tsx', 'utf-8');

// Insert useState effect logic
const scriptHooksContent = `  const [listSort, setListSort] = useState<'views' | 'likes' | 'name'>('name');
  
  // Custom Hook for Scroll
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);`;
dashboard = dashboard.replace(/  const \[listSort, setListSort\] = useState(?:<.*?>)?\('name'\);/, scriptHooksContent);

// Modify main header to NOT be sticky, and add Dynamic Sticky Header
dashboard = dashboard.replace(
  /<header className="bg-white\/90 backdrop-blur-xl border-b border-\[#e5e8eb\] sticky top-0 z-40 transition-all duration-300" role="banner">/,
  `{/* Dynamic Minimal Sticky Header */}
      <div 
        className={\`fixed top-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] shadow-sm z-50 transition-transform duration-300 flex items-center justify-center h-[52px] \${
          isScrolled ? 'translate-y-0' : '-translate-y-full'
        }\`}
      >
        <span className="font-extrabold text-[#191f28] tracking-wider text-[15px] flex items-center gap-2">
           <img src="/dsq-icon.png" alt="DSQ" className="w-[20px] h-[20px] rounded-md" />
           D-VIEW 동탄 아파트 가치 분석
        </span>
      </div>
      
      {/* Original Main Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8eb] relative z-40 transition-all duration-300" role="banner">`
);

fs.writeFileSync('src/components/DashboardClient.tsx', dashboard);
console.log('Finished updating header and user bar!');
