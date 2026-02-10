import Link from 'next/link';
import { getHomeData, getGlobalSettings } from '@/lib/googleSheets';
import GenericDashboard from '@/components/GenericDashboard';
import { FileDown, ArrowRight, Activity, TrendingUp } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  // Fetch data specifically for Home (ShowOnHome = TRUE)
  const { meta, data } = await getHomeData();
  const settings = await getGlobalSettings();
  const publicationLink = settings['publication_link'] || '#';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#10B981" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.7C59,41.9,47.1,49.5,35.4,56.7C23.7,63.9,12.1,70.7,-0.9,72.3C-13.9,73.9,-26.4,70.2,-37.5,63.3C-48.6,56.4,-58.3,46.3,-66.2,34.6C-74.1,22.9,-80.2,9.6,-80.6,-3.9C-81,-17.4,-75.7,-31.1,-66.3,-41.8C-56.9,-52.5,-43.4,-60.1,-30.1,-67.9C-16.8,-75.7,-3.7,-83.7,5.5,-85.4C14.7,-87.1,29.4,-82.5,44.7,-76.4Z" transform="translate(100 100)" />
           </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Activity size={14} /> Portal Data Terpadu
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              SAID <span className="text-emerald-400">Majene</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              Sistem Analisis Indikator Daerah Kabupaten Majene. Menyajikan data strategis, analisis tren, dan capaian kinerja pembangunan dalam satu dashboard terintegrasi.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/dashboard/ekonomi" 
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all flex items-center gap-2"
              >
                Lihat Dashboard <ArrowRight size={18} />
              </Link>
              <a 
                href={publicationLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <FileDown size={18} /> Unduh Publikasi
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" /> Indikator Unggulan
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Pantauan langsung indikator strategis yang dipilih untuk ditampilkan di beranda.
                    </p>
                </div>
            </div>

            {/* Use GenericDashboard Logic to Render Cards */}
            {meta.length > 0 ? (
                <div className="bg-slate-50 rounded-3xl">
                     <GenericDashboard 
                        data={data} 
                        meta={meta} 
                        category="Indikator Strategis" 
                     />
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400">Belum ada indikator yang dipilih untuk beranda.</p>
                </div>
            )}

        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm text-slate-500">© 2025 BPS Kabupaten Majene. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}