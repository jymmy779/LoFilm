import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Redirect non-www and/or HTTP to canonical https://www.munos.store (SEO & Indexing Fix)
  // Handles all cases in a SINGLE redirect to avoid redirect chains:
  //   http://munos.store  → https://www.munos.store  (1 hop)
  //   https://munos.store → https://www.munos.store  (1 hop)
  //   http://www.munos.store → https://www.munos.store (1 hop)
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  
  // Chỉ thực hiện redirect khi đang chạy trên production server thật (tránh lỗi khi mở bằng localhost hay IP Lan như 192.168.x.x)
  if (process.env.NODE_ENV === 'production' && !host.includes('localhost') && !host.includes('192.168')) {
    if (host === 'munos.store' || proto === 'http') {
      return NextResponse.redirect(
        `https://www.munos.store${pathname}${request.nextUrl.search}`,
        301
      );
    }
  }

  // 1. Kiểm tra Maintenance Mode trước (Không cần Auth)
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    const isStaticAsset = pathname.startsWith('/_next') || 
                          pathname.startsWith('/api') || 
                          pathname.includes('.') ||
                          pathname.startsWith('/favicon.ico');

    if (pathname !== '/maintenance' && !isStaticAsset) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } else if (pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. OPTIMIZATION: Nếu là trang PHIM hoặc trang công cộng, cho đi thẳng luôn
  // Việc này cực kỳ quan trọng để Next.js không gắn header 'private'
  const isPublicRoute = pathname.startsWith('/phim/') || 
                         pathname === '/' || 
                         pathname.startsWith('/danh-sach/') ||
                         pathname.startsWith('/the-loai/') ||
                         pathname.startsWith('/quoc-gia/');

  if (isPublicRoute && !pathname.includes('api')) {
     return NextResponse.next();
  }

  // 3. Chỉ xử lý Supabase Auth cho các trang cần thiết (Cá nhân, API, v.v.)
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  const isProtectedRoute = pathname.startsWith('/trang-ca-nhan') || pathname.startsWith('/history');

  if (hasAuthCookie || isProtectedRoute) {
    await supabase.auth.getUser()
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
