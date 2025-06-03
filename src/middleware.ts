import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware para redirigir todas las rutas a la página de mantenimiento
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const path = url.pathname
  
  // No redirigir si ya estamos en la página de mantenimiento o admin
  if (path === '/maintenance' || path.startsWith('/admin') || path.startsWith('/auth') || path.startsWith('/_next') || path.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Redirigir cualquier otra ruta a la página de mantenimiento
  url.pathname = '/maintenance'
  return NextResponse.redirect(url)
}

// Especificar en qué rutas aplicar el middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
