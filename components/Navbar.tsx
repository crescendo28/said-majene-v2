import Link from 'next/link';
import { getNavLinks } from '@/lib/googleSheets';
import { LayoutDashboard, Settings, Home, LineChart } from 'lucide-react';

export default async function Navbar() {
  // Fetch categories from Google Sheets
  const dynamicLinks = await getNavLinks();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SAID Majene</span>
          </Link>
          
          <div className="flex space-x-1 sm:space-x-4">
            <Link href="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <Home size={16} /> <span className="hidden md:inline">Home</span>
            </Link>

            {/* GENERATED LINKS */}
            {dynamicLinks.map((category) => (
              <Link 
                key={category}
                href={`/dashboard/${category.toLowerCase()}`} 
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                {category}
              </Link>
            ))}
            
            <Link href="/analysis" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <LineChart size={16} /> <span className="hidden md:inline">Analisis</span>
            </Link>
            
            <Link href="/admin" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <Settings size={16} /> <span className="hidden md:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}