import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutShell } from '@/components/layout/layout-shell';

export const metadata: Metadata = {
  title: 'QubixPrep - AI Medical Learning Platform',
  description: 'Modern AI-powered medical learning platform for MBBS and NEET-PG students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-white">
        <FirebaseClientProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
