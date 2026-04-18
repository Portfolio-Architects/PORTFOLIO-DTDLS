import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeNavigationOptions {
  threshold?: number;
  edgeWidth?: number;
  onBack?: () => void;
  enabled?: boolean;
}

export function useSwipeNavigation({
  threshold = 80,
  edgeWidth = 40,
  onBack,
  enabled = true,
}: SwipeNavigationOptions = {}) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only trigger if swipe starts from the very left edge (iOS/Android native-like)
      if (touch.clientX <= edgeWidth) {
        startX.current = touch.clientX;
      } else {
        startX.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === null) return;
      currentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (startX.current !== null && currentX.current !== null) {
        const deltaX = currentX.current - startX.current;
        if (deltaX >= threshold) {
          if (onBack) {
            onBack();
          } else {
            router.back();
          }
        }
      }
      startX.current = null;
      currentX.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, threshold, edgeWidth, onBack, enabled]);
}
