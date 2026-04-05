import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clarence Espanol | Full Stack Developer',
  description: 'Full Stack Developer with experience in web development, UI/UX design, and technical documentation. Building modern, functional, and user-friendly applications.',
  generator: 'v0.app',
  keywords: ['Full Stack Developer', 'Web Developer', 'UI/UX Designer', 'React', 'Next.js', 'TypeScript'],
  authors: [{ name: 'Clarence P. Espanol' }],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Cormorant Garamond — high-contrast elegant serif, visually identical
          to The Seasons. Same refined luxury feel, free on Google Fonts.

          Montserrat — clean geometric sans for all body/UI text.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {/* Analytics only runs in production — avoids burning edge quota during local dev */}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}