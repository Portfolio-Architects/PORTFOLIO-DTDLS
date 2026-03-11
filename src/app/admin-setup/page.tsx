'use client';

import { useState } from 'react';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secretKey: secret }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to set admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-[#e5e8eb] p-8">
        <h1 className="text-2xl font-bold text-[#191f28] text-center mb-2">👑 관리자 권한 설정</h1>
        <p className="text-sm text-[#4e5968] text-center mb-8">
          초기 서비스 관리를 위한 Admin 권한을 부여합니다.<br/>
          (브라우저에서 해당 구글 계정으로 1번 이상 로그인한 상태여야 합니다)
        </p>
        
        {message && <div className="mb-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] text-[#03c75a] font-medium rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{message}</div>}
        {error && <div className="mb-6 p-4 bg-[#fff5f5] border border-[#ffebec] text-[#f04452] font-medium rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{error}</div>}

        <form onSubmit={handleSetup} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-[#4e5968] mb-1.5 pl-1">권한을 부여받을 구글 이메일</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-all placeholder-[#b0b8c1]"
              placeholder="예: admin@example.com"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#4e5968] mb-1.5 pl-1">시크릿 키 (보안용)</label>
            <input 
              type="password" 
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-all placeholder-[#b0b8c1]"
              placeholder="기본값: 동탄랩스어드민루트"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-[#3182f6] text-white font-bold text-[16px] py-3.5 rounded-xl hover:bg-[#1b64da] active:bg-[#195bc7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? '처리 중...' : '권한 부여하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
