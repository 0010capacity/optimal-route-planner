import { NextResponse } from 'next/server'

export function middleware(request) {
  // API 요청 로깅
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] API Request:`, {
      method: request.method,
      url: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });
  }

  // 지도 관련 요청에 대한 캐시 헤더 추가
  if (request.nextUrl.pathname.includes('/api/directions')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
