import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistem Analisis Isu Strategis Daerah Majene',
  description: 'Sistem Analisis Isu Daerah Kabupaten Majene',
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <NavbarWrapper />
          <div className="grow">
            {children}
          </div>
          {/* GLOBAL FOOTER */}
          <footer className="bg-slate-900 border-t border-slate-800 py-8 px-6">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-slate-400 text-sm font-medium">
                © 2026 BPS Kabupaten Majene - Amanda Chairunisa GP
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}