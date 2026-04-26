'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Floating banner that appears when the user goes offline,
 * and briefly shows a "reconnected" message when they come back online.
 */
export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-bold transition-all duration-300 ${
        isOnline
          ? 'bg-toss-green text-surface animate-in slide-in-from-top'
          : 'bg-[#333d4b] text-surface animate-in slide-in-from-top'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={15} />
          네트워크가 다시 연결되었습니다
        </>
      ) : (
        <>
          <WifiOff size={15} />
          오프라인 상태입니다 — 일부 기능이 제한됩니다
        </>
      )}
    </div>
  );
}
