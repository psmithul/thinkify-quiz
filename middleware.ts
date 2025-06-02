import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Handle authentication redirects
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup')) {
      try {
        // Get user role to determine redirect
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const dashboardUrl = userData?.role === 'admin' ? '/admin/dashboard' :
                            userData?.role === 'creator' ? '/creator/dashboard' :
                            '/user/dashboard';

        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      } catch (error) {
        // If there's an error fetching user data, default to user dashboard
        return NextResponse.redirect(new URL('/user/dashboard', request.url))
      }
    }
  }

  // Protect authenticated routes
  const protectedPaths = ['/user/', '/creator/', '/admin/']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isProtectedPath && !user) {
    // Save the intended destination
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 