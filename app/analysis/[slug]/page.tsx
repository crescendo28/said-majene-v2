import { analysisData } from '@/lib/hardcodedAnalysis';
import { AnalysisChart } from '@/components/AnalysisChart';
import { ArrowLeft, Database, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export default async function AnalysisDetailPage({params}: PageProps) {
    const { slug } = await params;
    
  const key = slug.toLowerCase() as keyof typeof analysisData;
  const content = analysisData[key];

  if (!content) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Halaman Analisis Tidak Ditemukan</h1>
                <Link href="/analysis" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition inline-block">
                    Kembali ke Daftar
                </Link>
            </div>
        </div>
      );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 font-sans pb-20">
       
       <div className="bg-slate-900 text-white pt-24 pb-32 px-6 rounded-b-[40px] shadow-xl relative overflow-hidden">
            <div className="max-w-5xl mx-auto relative z-10">
                <Link href="/analysis" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft size={18}/> Kembali
                </Link>
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        {content.category}
                    </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black leading-tight">
                    {content.title}
                </h1>
            </div>
            
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/4">
                <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#10B981" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.7C59,41.9,47.1,49.5,35.4,56.7C23.7,63.9,12.1,70.7,-0.9,72.3C-13.9,73.9,-26.4,70.2,-37.5,63.3C-48.6,56.4,-58.3,46.3,-66.2,34.6C-74.1,22.9,-80.2,9.6,-80.6,-3.9C-81,-17.4,-75.7,-31.1,-66.3,-41.8C-56.9,-52.5,-43.4,-60.1,-30.1,-67.9C-16.8,-75.7,-3.7,-83.7,5.5,-85.4C14.7,-87.1,29.4,-82.5,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
            </div>
       </div>

       <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20">
            <div className="bg-white rounded-4xl shadow-sm border border-slate-100 p-8 md:p-12">
                <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed mb-12 whitespace-pre-wrap">
                    {content.description}
                </div>

                {content.charts.map((chart, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200 mb-10 last:mb-0">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Database size={18} className="text-emerald-500"/> {chart.title}
                        </h3>
                        
                        <div className="h-112.5 w-full bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                            <AnalysisChart 
                                type={chart.type} 
                                data={chart.data} 
                                // Explicitly mapping for scatter vs others to ensure data shows up
                                xCol={chart.type === 'scatter' ? 'x' : (chart.xAxisLabel || 'label')} 
                                yCol={chart.type === 'scatter' ? 'y' : (chart.yAxisLabel || 'value')} 
                                label={chart.title}
                                tooltipCol={chart.tooltipCol}
                                series={chart.series}
                                yAxisLabel2={chart.yAxisLabel2}
                            />
                        </div>
                    </div>
                ))}

                <p className="text-center text-xs text-slate-400 mt-12 italic">
                    Sumber: Publikasi Analisis Isu Terkini BPS Kabupaten Majene (Tahun 2025)
                </p>
            </div>
       </div>
    </main>
  );
}