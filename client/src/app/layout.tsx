import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { PageBackground } from '@/components/layout/PageBackground';
import { NavBar } from '@/components/layout/NavBar';
import { RouteFocus } from '@/components/layout/RouteFocus';

export const metadata: Metadata = {
  title: { default: 'SoilMate', template: '%s | SoilMate' },
  description: 'SoilMate helps farmers plan smarter field rotations with NASA Earth data.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ecfcf0',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PageBackground />
          <NavBar />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <RouteFocus />
        </Providers>
      </body>
    </html>
  );
}
