import Link from 'next/link';
import { getNavLinks } from '@/lib/googleSheets';
import { LayoutDashboard, Settings, Home, LineChart, ChevronDown } from 'lucide-react';

export default async function Navbar() {
  // Fetch categories from Google Sheets
  // This runs on the server, ensuring fresh links on page load/revalidate
  const dynamicLinks: string[] = await getNavLinks();

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
          
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link href="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <Home size={16} /> <span className="hidden md:inline">Home</span>
            </Link>

            {/* Dropdown for Dashboards */}
            <div className="relative group">
              <button className="text-slate-300 group-hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors focus:outline-none">
                <LayoutDashboard size={16} /> 
                <span className="hidden md:inline">Dashboards</span>
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              
              {/* Invisible bridge to handle the gap between button and menu */}
              <div className="absolute left-0 w-full h-2 top-full bg-transparent"></div>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kategori
                  </div>
                  {dynamicLinks.length > 0 ? (
                    dynamicLinks.map((category: string) => (
                      <Link 
                        key={category}
                        href={`/dashboard/${category.toLowerCase()}`} 
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors capitalize"
                      >
                        {category}
                      </Link>
                    ))
                  ) : (
                    <span className="block px-4 py-2 text-sm text-slate-500">No data found</span>
                  )}
                </div>
              </div>
            </div>

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