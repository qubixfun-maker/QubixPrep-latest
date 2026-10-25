import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutShell } from '@/components/layout/layout-shell';
import { JellyProvider } from '@/components/jelly/JellyProvider';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { OfflineBanner } from '@/components/offline-banner';

export const metadata: Metadata = {
  title: 'QubixPrep - AI Medical Learning Platform',
  description: 'Modern AI-powered medical learning platform for MBBS and NEET-PG students.',
  metadataBase: new URL('https://qubixprep.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png?v=2',
  },
  openGraph: {
    title: 'QubixPrep - AI Medical Learning Platform',
    description: 'Notes, QBank, PYQs and full-length Grand Tests for MBBS and NEET-PG.',
    url: 'https://qubixprep.com',
    siteName: 'QubixPrep',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'QubixPrep' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'QubixPrep', images: ['/brand/og-image.png'] },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'QubixPrep',
  },
};

export const viewport = {
  themeColor: '#7552ee',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-white">
        <FirebaseClientProvider>
          <JellyProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
          </JellyProvider>
          <Toaster />
          <PwaInstallPrompt />
          <ServiceWorkerRegister />
          <OfflineBanner />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
