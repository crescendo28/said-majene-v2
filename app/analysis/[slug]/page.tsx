import AnalysisChart from '@/components/AnalysisChart';
import DataTable from '@/components/DataTable';
import { getAnalysisConfig, getAnalysisData } from '@/lib/googleSheets';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, TableProperties, Calendar } from 'lucide-react';

export const revalidate = 0; // Force dynamic fetch so updates show immediately

export default async function AnalysisDetail({ params }: { params: Promise<{ slug: string }> }) {
  // Await params first to satisfy Next.js 15+ requirements
  const resolvedParams = await params;
  
  const configs = await getAnalysisConfig();
  const config = configs.find((c: any) => c.Id === resolvedParams.slug && c.Status === 'Aktif');

  if (!config) {
    notFound();
  }

  // Fetch dynamic data based on the sheet name defined in the config
  const rawData = await getAnalysisData(config.SheetName);

  return (
    <div className="font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 pt-12">
        <Link href="/analysis" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-medium text-sm mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Kembali ke Daftar Analisis
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {config.Category}
            </span>
            
            {/* Added dynamic Year badge here! */}
            {config.Year && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                 <Calendar size={12} /> Tahun {config.Year}
              </span>
            )}

            {/* Changed the ID to be very small, subtle, and pushed to the right side */}
            <span className="text-[10px] text-slate-300 font-mono ml-auto select-all" title="ID Analisis">
              #{config.Id}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            {config.Title}
          </h1>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
            {config.Description || 'Tidak ada deskripsi untuk analisis ini.'}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LayoutDashboard size={20} className="text-blue-500" /> Visualisasi Data
              </h3>
              <div className="min-h-100">
                 <AnalysisChart data={rawData} config={config} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-125">
              <div className="p-6 border-b border-slate-100 flex items-center gap-2 shrink-0">
                <TableProperties size={20} className="text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-800">Tabel Data</h3>
              </div>
              <div className="p-0 overflow-y-auto flex-1 relative">
                 <DataTable data={rawData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}