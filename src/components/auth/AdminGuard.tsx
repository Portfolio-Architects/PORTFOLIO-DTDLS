'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        router.push('/');
        return;
      }

      try {
        // Force refresh the token to get the latest custom claims
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.admin === true) {
          setIsAuthorized(true);
        } else {
          console.error("User does not have admin claims.");
          setIsAuthorized(false);
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching token claims:", error);
        setIsAuthorized(false);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f4f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#3182f6]" size={40} />
          <p className="text-[#4e5968] font-medium">관리자 권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
