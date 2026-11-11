import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'DisasterReady — Disaster Awareness, Preparedness & Emergency Response',
  description:
    'A unified platform empowering citizens and emergency management authorities with real-time hazard alerts, scientific disaster safety guides, and community drill coordination.',
  keywords: [
    'disaster preparedness',
    'emergency alerts',
    'safe shelter locator',
    'earthquake safety',
    'flood response',
    'mock drills',
    'emergency response',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#172B4D] antialiased">
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
