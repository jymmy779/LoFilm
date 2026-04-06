import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check maintenance mode
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const { pathname } = request.nextUrl;

  if (isMaintenanceMode) {
    // If it's maintenance mode, redirect every request to /maintenance 
    // unless it's already /maintenance or a static asset
    const isStaticAsset = pathname.startsWith('/_next') || 
                          pathname.startsWith('/api') || 
                          pathname.includes('.') ||
                          pathname.startsWith('/favicon.ico');

    if (pathname !== '/maintenance' && !isStaticAsset) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } else {
    // Handle the case where maintenance is turned OFF:
    // If the user manually navigates to /maintenance, send them home
    if (pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // OPTIMIZATION: Only check for session if we have a supabase cookie or if it's a protected route
  // This saves a remote API call to Supabase for every public or non-logged-in request.
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  const isProtectedRoute = pathname.startsWith('/profile') || pathname.startsWith('/history');

  if (hasAuthCookie || isProtectedRoute) {
    // This will refresh session if expired - essential for Server Components
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
