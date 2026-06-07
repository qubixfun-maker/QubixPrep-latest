import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from '@/components/ui/toaster';

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
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-white">
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 pb-20 md:pb-0">
              {children}
            </main>
          </div>
          <MobileNav />
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}