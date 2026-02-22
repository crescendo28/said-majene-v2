import Link from 'next/link';
import { getAnalysisConfig } from '@/lib/googleSheets';
import { FileText, ArrowRight, BarChart2, Calendar } from 'lucide-react';

export const revalidate = 0; // Force dynamic fetch for the analysis list

export default async function AnalysisPage() {
  // Fetch dynamic config from Google Sheets
  const configs = await getAnalysisConfig();
  const activeAnalyses = configs.filter((c: any) => c.Status === 'Aktif');

  // Group analyses by category
  const grouped = activeAnalyses.reduce((acc: any, curr: any) => {
    const cat = curr.Category || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 pt-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Analisis Isu Strategis</h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            Kumpulan analisis mendalam berdasarkan data indikator makro Kabupaten Majene.
          </p>
        </header>

        {Object.keys(grouped).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Belum ada analisis yang aktif</h3>
                <p className="text-slate-500 mt-2">Tambahkan dan aktifkan analisis melalui panel Analysis Admin.</p>
            </div>
        ) : (
            <div className="space-y-12">
              {Object.keys(grouped).map((category) => (
                <section key={category}>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped[category].map((item: any) => (
                      <Link href={`/analysis/${item.Id}`} key={item.Id} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <FileText size={24} />
                            </div>
                            {item.Year && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                  <Calendar size={10} /> {item.Year}
                              </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{item.Title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3 mb-6">{item.Description}</p>
                        <div className="mt-auto flex items-center justify-between">
                            <span className="text-blue-600 font-bold text-sm flex items-center">
                              Baca Analisis <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <span className="text-[9px] text-slate-300 font-mono">#{item.Id}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
        )}
      </main>
    </div>
  );
}