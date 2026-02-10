import Link from 'next/link';
import { getHomeData, getGlobalSettings } from '@/lib/googleSheets';
import HomeIndicatorCard from '@/components/HomeIndicatorCard';
import { FileDown, ArrowRight, Activity, TrendingUp } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  const { meta, data } = await getHomeData();
  const settings = await getGlobalSettings();
  const publicationLink = settings['publication_link'] || '#';

  // Helper to get ALL historical data for a variable
  const getVariableHistory = (varId: string) => {
    return data
        .filter((d: any) => String(d.id_variable) === String(varId))
        .sort((a: any, b: any) => Number(a.Tahun) - Number(b.Tahun));
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 font-sans">
      
      {/* NAVBAR removed - using global layout navbar */}

      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white relative overflow-hidden pt-32 pb-48 rounded-b-[40px] shadow-2xl shadow-slate-900/20">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

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
      <section className="px-6 -mt-32 relative z-20 pb-20">
        <div className="max-w-7xl mx-auto">
            
            {meta.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-8">
                     {meta.map((m: any) => {
                        const history = getVariableHistory(m.Id);
                        if (!history || history.length === 0) return null;
                        
                        return (
                            <div key={m.Id} className="w-full md:w-[calc(50%-16px)] min-w-[320px] max-w-[700px]">
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

        </div>
      </section>

      
    </main>
  );
}