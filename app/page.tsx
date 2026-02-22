import Link from 'next/link';
import { getHomeData, getGlobalSettings, getAnalysisConfig } from '@/lib/googleSheets';
import HomeIndicatorCard from '@/components/HomeIndicatorCard';
import { FileDown, ArrowRight, FileText, Calendar } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  const [homeDataResult, settings, analysisConfigs] = await Promise.all([
    getHomeData(),
    getGlobalSettings(),
    getAnalysisConfig()
  ]);

  const { meta, data } = homeDataResult;
  const publicationLink = settings['publication_link'] || '#';

  const getVariableHistory = (varId: string) => {
    return data
        .filter((d: any) => String(d.id_variable) === String(varId))
        .sort((a: any, b: any) => Number(a.Tahun) - Number(b.Tahun))
        .slice(-5); 
  };

  const activeAnalyses = (analysisConfigs || [])
    .filter((c: any) => c.Status === 'Aktif')
    .slice(0, 3); 

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 font-sans pb-20">
      
      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white relative overflow-hidden pt-32 pb-48 rounded-b-[40px] shadow-2xl shadow-slate-900/20">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
        <div className="absolute top-[-20%] right-[-10%] w-150 h-150 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            
            <h6 className="text-2xl md:text-5xl font-black tracking-tight mb-2">
                Sistem Analisis Isu Strategis Daerah
            </h6>
            <h4 className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tight mb-8">
                Kabupaten Majene
            </h4>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-4xl mx-auto mb-10">
               Kajian isu strategis daerah Kabupaten Majene edisi ini berfokus pada dua pilar utama: analisis kemiskinan untuk memahami tingkat kesejahteraan masyarakat, dan analisis daya saing ekonomi untuk memetakan kekuatan serta potensi sektoral daerah.
            </p>
            
            <div className="flex justify-center gap-4">
                <a 
                    href={publicationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform flex items-center gap-2 group"
                >
                    <FileDown size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> 
                    <span>Unduh Publikasi PDF</span>
                </a>
            </div>

        </div>
      </section>

      {/* CARDS SECTION (Overlapping Hero) */}
      <section className="px-6 -mt-32 relative z-20">
        <div className="max-w-7xl mx-auto">
            
            {meta.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-8">
                     {meta.map((m: any) => {
                        const history = getVariableHistory(m.Id);
                        if (!history || history.length === 0) return null;
                        
                        return (
                            <div key={m.Id} className="w-full md:w-[calc(50%-16px)] min-w-[320px] max-w-175">
                                <HomeIndicatorCard 
                                    meta={m}
                                    history={history}
                                />
                            </div>
                        );
                     })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                    <p className="text-slate-400 font-medium">Belum ada indikator yang dipilih untuk beranda.</p>
                </div>
            )}

            {/* ANALYSIS SHORTCUT BANNER */}
            <div className="mt-16 bg-white rounded-[24px] p-8 md:p-10 shadow-[0px_10px_30px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Kajian Analisis Isu Strategis</h3>
                  <p className="text-slate-500 font-medium">Baca kajian dan visualisasi mendalam mengenai berbagai sektor indikator makro di Kabupaten Majene.</p>
                </div>
              </div>
              
              <Link 
                href="/analysis" 
                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 hover:-translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                Lihat Semua Analisis <ArrowRight size={18} />
              </Link>
            </div>

            {/* ANALYSIS LIST PREVIEW GRID */}
            {activeAnalyses.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAnalyses.map((item: any) => (
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
                    <div className="mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                         {item.Category}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{item.Title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3 mb-6">{item.Description}</p>
                    <div className="mt-auto flex items-center text-blue-600 font-bold text-sm">
                      Baca Analisis <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

        </div>
      </section>

    </main>
  );
}
