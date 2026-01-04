import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // 1. إنشاء استجابة أولية
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. إعداد Supabase Client للتعامل مع الكوكيز
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

  // 3. التحقق من حالة المستخدم
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // --- قواعد التوجيه والحماية ---

  // أ) حماية لوحة التحكم (Dashboard Protected Route)
  // إذا لم يكن هناك مستخدم ويحاول دخول أي صفحة تبدأ بـ /dashboard
  if (!user && path.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ب) توجيه المستخدم المسجل (Auth Redirects)
  if (user) {
    // 1. إذا حاول دخول صفحة الدخول (/login) أو التسجيل (/register) أو الرئيسية (/)
    if (path === '/login' || path === '/register' || path === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}