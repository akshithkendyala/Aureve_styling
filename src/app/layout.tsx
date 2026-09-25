import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AUREVÉ — Your Wardrobe. Intelligently Styled.',
  description:
    'A private AI-powered digital wardrobe and personal styling platform. Simple, classy, modern, and designed for realistic Indian styling.',
  keywords: [
    'AUREVE',
    'AI stylist',
    'digital wardrobe',
    'mens fashion India',
    'outfit generator',
    'personal styling',
    'wardrobe assistant',
  ],
  authors: [{ name: 'AUREVÉ' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#FBF9F6] text-[#18181B] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
