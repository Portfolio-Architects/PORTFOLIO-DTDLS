import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인메모리 간이 Rate Limiter 
// Edge 환경에서는 Worker 인스턴스별 단독 상태를 갖지만, 일반적인 무차별 대입이나 크롤러 방어에는 효과적입니다.
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

const RATE_LIMIT_POINTS = 60; // 분당 60회 허용 (엔드유저 1명 기준 넉넉한 수치)
const DURATION = 60 * 1000; // 1분 유지

export function middleware(request: NextRequest) {
  // 클라이언트 IP 추출 (Vercel 환경 지원)
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // 1. Rate Limiting (API 라우트에 국한)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const currentTime = Date.now();
    const limitInfo = rateLimitMap.get(ip) || { count: 0, resetTime: currentTime + DURATION };

    // 타이머가 지났으면 카운트 초기화
    if (currentTime > limitInfo.resetTime) {
      limitInfo.count = 0;
      limitInfo.resetTime = currentTime + DURATION;
    }

    limitInfo.count += 1;
    rateLimitMap.set(ip, limitInfo);

    // 제한 횟수 초과 시 즉각 차단
    if (limitInfo.count > RATE_LIMIT_POINTS) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too Many Requests', 
          message: '비정상적인 트래픽이 감지되어 요청이 차단되었습니다. 잠시 후 다시 시도해주십시오.' 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((limitInfo.resetTime - currentTime) / 1000).toString(),
          } 
        }
      );
    }
  }

  // 2. HTTP Security 헤더 주입 파이프라인
  const response = NextResponse.next();

  // CSP: XSS 방어를 위해 허가된 리소스만 로딩
  // Next.js 개발 및 런타임을 위해 호환되는 플래그('unsafe-inline', 'unsafe-eval')만 최소 허용하며, 서드파티 스크립트 도메인을 제어합니다.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://maps.googleapis.com https://www.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    img-src 'self' blob: data: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net;
    connect-src 'self' https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://maps.googleapis.com https://vitals.vercel-insights.com;
    frame-src 'self' https://www.google.com https://www.youtube.com https://portfolio-dtdls.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // 헤더 부여
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY'); // Clickjacking 원천 차단 (iframe 임베딩 방지)
  response.headers.set('X-Content-Type-Options', 'nosniff'); // MIME 타입 변조 방지 
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // 외부 링크 이동 시 리퍼러 보호
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)'); // 하드웨어 API 권한 탈취 방지

  return response;
}

// 미들웨어 구동 범위 (정적 에셋 등 불필요한 연산 방지)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|_vercel|assets|css|js|images).*)',
  ],
};
