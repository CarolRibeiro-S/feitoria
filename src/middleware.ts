import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Nunca usar getSession() no middleware — não confia no JWT local
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rotas protegidas ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Busca tipo autoritativo da tabela usuarios (necessário para admins promovidos via SQL)
    const { data: record } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', user.id)
      .maybeSingle()

    // Fallback para user_metadata caso RLS bloqueie a leitura da tabela
    const tipo: string = record?.tipo ?? user.user_metadata?.tipo ?? ''

    if (pathname.startsWith('/admin') && tipo !== 'admin') {
      return NextResponse.redirect(new URL('/?acesso=negado', request.url))
    }

    if (pathname.startsWith('/dashboard') && tipo !== 'produtora') {
      return NextResponse.redirect(new URL('/?acesso=negado', request.url))
    }
  }

  // ── Redireciona usuário já logado para fora das páginas de auth ──────────────
  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    const { data: record } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', user.id)
      .maybeSingle()

    const tipo: string = record?.tipo ?? user.user_metadata?.tipo ?? ''

    if (tipo === 'produtora') return NextResponse.redirect(new URL('/dashboard', request.url))
    if (tipo === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/', request.url))
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
