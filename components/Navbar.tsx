'use client';

import Link from 'next/link';
import { LayoutDashboard, Settings, Home, LineChart, ChevronDown } from 'lucide-react';
import Image from "next/image";
import { useEffect, useState } from 'react';

export default function Navbar({ dynamicLinks }: { dynamicLinks: string[] }) {
  const [open, setOpen] = useState(false);

  // close dropdown when user clicks outside
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-3">

          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image
              src="/logo.png"
              alt="SAID Majene Logo"
              width={45}
              height={45}
              className="rounded-lg shrink-0"
            />
            <span className="text-white font-bold text-sm sm:text-base tracking-tight">
              <span className="sm:hidden"> </span>
              <span className="hidden sm:inline">Sistem Analisis Isu Strategis Daerah</span>
            </span>

          </Link>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              href="/"
              className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Home size={16} /> <span className="hidden md:inline">Home</span>
            </Link>

            {/* Dropdown Dashboards */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // prevent auto close
                  setOpen(!open);
                }}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <LayoutDashboard size={16} />
                <span className="hidden md:inline">Dashboards</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {open && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Kategori
                    </div>

                    {dynamicLinks.length > 0 ? (
                      dynamicLinks.map((category) => (
                        <Link
                          key={category}
                          href={`/dashboard/${category.toLowerCase()}`}
                          className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors capitalize"
                          onClick={() => setOpen(false)}
                        >
                          {category}
                        </Link>
                      ))
                    ) : (
                      <span className="block px-4 py-2 text-sm text-slate-500">
                        No data found
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/analysis"
              className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <LineChart size={16} /> <span className="hidden md:inline">Analisis</span>
            </Link>

            <Link
              href="/admin"
              className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Settings size={16} /> <span className="hidden md:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
