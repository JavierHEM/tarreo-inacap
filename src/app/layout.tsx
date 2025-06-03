// app/layout.tsx
import './globals.css'
import type { Metadata, Viewport } from 'next'

// Exportación separada para viewport según las recomendaciones de Next.js 15.3.2
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
}

export const metadata: Metadata = {
  title: 'Tarreo Gamer Otoño 2025 - INACAP Osorno',
  description: 'Evento gamer nocturno para estudiantes de INACAP Sede Osorno. Torneos de videojuegos y juegos de mesa.',
  keywords: 'gaming, torneo, INACAP, Osorno, videojuegos, estudiantes',
  authors: [{ name: 'INACAP Osorno' }]
}

// Utilizamos un componente wrapper cliente para el anuncio

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Estilos críticos inline para garantizar la carga */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #0F172A;
            color: #F8FAFC;
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}} />
      </head>
      <body className="bg-slate-900 text-slate-50" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}
