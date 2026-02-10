import Link from 'next/link';
import { ArrowRight, FileBarChart, TrendingUp, Activity } from 'lucide-react';

export const revalidate = 3600;

export default function AnalysisIndexPage() {
  const analyses = [
      {
          slug: "ekonomi",
          title: "Analisis Pergeseran Struktur Ekonomi (Shift-Share)",
          category: "Ekonomi",
          desc: "Identifikasi sektor unggulan, potensial, dan tertinggal di Kabupaten Majene dibandingkan dengan Provinsi Sulawesi Barat.",
          icon: <TrendingUp size={24} className="text-blue-600"/>,
          color: "bg-blue-50"
      },
      {
          slug: "kemiskinan",
          title: "Analisis Kemiskinan (Indeks FGT)",
          category: "Kemiskinan",
          desc: "Kajian mendalam mengenai Headcount Index, Kedalaman, dan Keparahan Kemiskinan untuk strategi pengentasan yang lebih efektif.",
          icon: <Activity size={24} className="text-rose-600"/>,
          color: "bg-rose-50"
      }
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 font-sans pb-20">
      
      {/* HEADER */}
      <section className="bg-slate-900 text-white pt-32 pb-20 px-6 rounded-b-[40px] shadow-xl">
         <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Analisis Tematik</h1>
            <p className="text-slate-400 text-lg">Ulasan mendalam dan visualisasi data khusus dari BPS Kabupaten Majene.</p>
         </div>
      </section>

      {/* CARD GRID */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {analyses.map((item) => (
              <Link href={`/analysis/${item.slug}`} key={item.slug} className="group">
                  <article className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col">
                      
                      <div className="flex justify-between items-start mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}>
                              {item.icon}
                          </div>
                          <span className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                              <ArrowRight size={20}/>
                          </span>
                      </div>

                      <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                          <h2 className="text-2xl font-bold text-slate-900 mt-2 leading-tight group-hover:text-emerald-600 transition-colors">
                              {item.title}
                          </h2>
                      </div>

                      <p className="text-slate-500 leading-relaxed mb-6 flex-grow">
                          {item.desc}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 mt-auto">
                          <FileBarChart size={16}/>
                          <span>Baca Analisis Lengkap</span>
                      </div>

                  </article>
              </Link>
          ))}

      </div>
    </main>
  );
}