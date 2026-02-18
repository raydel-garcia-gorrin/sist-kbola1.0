// middleware.ts
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareSupabaseClient(request)

    // Refresh session if expired - importante para obtener la sesión actualizada
    const { data: { session } } = await supabase.auth.getSession()

    // Definir rutas públicas
    const publicRoutes = ['/', '/login', '/register', '/recuperar-password']
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

    // Log para debugging
    console.log('Middleware - Path:', request.nextUrl.pathname)
    console.log('Middleware - Session:', !!session)

    // Si no hay sesión y la ruta no es pública, redirigir a login
    if (!session && !isPublicRoute) {
      console.log('Middleware - Redirigiendo a login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Si hay sesión y está en ruta pública (excepto /), redirigir a dashboard
    if (session && isPublicRoute && request.nextUrl.pathname !== '/') {
      console.log('Middleware - Redirigiendo a dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (e) {
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}