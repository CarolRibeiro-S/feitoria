import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabase SSR exige que a resposta seja construída assim para poder setar cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propaga cookies tanto na request quanto na response (refresh de sessão)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão — nunca usar getSession() no middleware (não confia no JWT local)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Proteção de /dashboard e /admin — qualquer usuário autenticado ──────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── Redireciona usuário já logado para fora das páginas de auth ────────────
  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    const tipo = user.user_metadata?.tipo
    return NextResponse.redirect(
      new URL(tipo === 'produtora' ? '/dashboard' : '/', request.url)
    )
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/cadastro',
  ],
}
