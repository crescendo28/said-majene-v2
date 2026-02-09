import { getSheetData, getDashboardData } from '@/lib/googleSheets';
import HomeChart from '@/components/HomeChart';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, FileText, Activity, TrendingUp } from 'lucide-react';

export const revalidate = 3600;

export default async function Home() {
  // 1. Fetch Data
  // We fetch 'ekonomi' and 'kemiskinan' specifically to populate the cards
  const { data: ekonData } = await getDashboardData('ekonomi');
  const { data: kemisData } = await getDashboardData('kemiskinan');
  
  // 2. Process Data for Cards (Get the latest year's value)
  // ID 43: Laju Pertumbuhan
  // ID 88: Persentase Penduduk Miskin
  
  // Helper to get latest value
  const getLatest = (dataset: any[], id: string) => {
    const specificVar = dataset.filter(d => d.id_variable === id);
    if (specificVar.length === 0) return { year: 'N/A', value: 0 };
    
    // Sort by year desc
    const sorted = specificVar.sort((a, b) => Number(b.Tahun) - Number(a.Tahun));
    const latest = sorted[0];
    const prev = sorted[1];
    const value = parseFloat(String(latest.Nilai).replace(',', '.'));
    const prevValue = prev ? parseFloat(String(prev.Nilai).replace(',', '.')) : value;
    
    return { 
      year: latest.Tahun, 
      value: value,
      trend: value > prevValue ? 'up' : 'down',
      diff: Math.abs(value - prevValue).toFixed(2)
    };
  };

  const growth = getLatest(ekonData, '43');
  const poverty = getLatest(kemisData, '88');

  // Combine data for the big chart
  const allData = [...ekonData, ...kemisData];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HERO SECTION */}
      <header className="relative bg-slate-900 overflow-hidden pt-16 pb-32 lg:pb-40">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
        </div>
        
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800"></div>

        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                   Data Tahun {Math.max(Number(growth.year), Number(poverty.year))}
                </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Analisis Isu Terkini <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
                Kabupaten Majene
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
               Platform integrasi data strategis untuk memantau indikator Ekonomi dan Sosial secara real-time.
            </p>

            <div className="flex justify-center gap-4">
               <button className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center shadow-lg hover:bg-slate-50 transition-all text-sm group">
                  <FileText className="w-4 h-4 mr-2 text-slate-500 group-hover:text-emerald-600" />
                  Unduh Publikasi PDF
               </button>
            </div>
        </div>
      </header>

      {/* STRATEGIC PILLARS (Overlapping Cards) */}
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: EKONOMI */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-slate-200 shadow-xl hover:-translate-y-1 transition-transform duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                     <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                        <TrendingUp size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">Ekonomi Daerah</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Laju Pertumbuhan</p>
                     </div>
                  </div>
                  <Link href="/dashboard/ekonomi" className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                     Dashboard <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-6 mb-6">
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Realisasi {growth.year}</p>
                     <p className="text-4xl font-black text-slate-900">{growth.value}<span className="text-lg text-slate-400 font-bold">%</span></p>
                     <p className={`text-xs font-bold mt-1 flex items-center ${growth.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {growth.trend === 'up' ? '↑ Naik' : '↓ Turun'} {growth.diff}% dari tahun lalu
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Target RPJMD</p>
                     <div className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md text-lg font-bold">
                        5.20 - 5.60%
                     </div>
                  </div>
               </div>
               <p className="text-sm text-slate-600 leading-relaxed">
                  Ekonomi Majene menunjukkan tren positif. Sektor pertanian dan jasa menjadi penopang utama pertumbuhan.
               </p>
            </div>

            {/* CARD 2: KEMISKINAN */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 border border-slate-200 shadow-xl hover:-translate-y-1 transition-transform duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                     <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
                        <Activity size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">Kemiskinan</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Persentase Penduduk Miskin</p>
                     </div>
                  </div>
                  <Link href="/dashboard/kemiskinan" className="text-sm font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                     Dashboard <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-6 mb-6">
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Realisasi {poverty.year}</p>
                     <p className="text-4xl font-black text-slate-900">{poverty.value}<span className="text-lg text-slate-400 font-bold">%</span></p>
                     <p className={`text-xs font-bold mt-1 flex items-center ${poverty.trend === 'down' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {poverty.trend === 'down' ? '↓ Turun' : '↑ Naik'} {poverty.diff}% dari tahun lalu
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Target RPJMD</p>
                     <div className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-md text-lg font-bold">
                        &lt; 13.50%
                     </div>
                  </div>
               </div>
               <p className="text-sm text-slate-600 leading-relaxed">
                  Tingkat kemiskinan mengalami penurunan. Fokus pada program perlindungan sosial untuk mempertahankan tren ini.
               </p>
            </div>

         </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <main className="max-w-7xl mx-auto px-6 py-20" id="analysis">
         <div className="flex items-center space-x-4 mb-10">
            <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
            <div>
               <h3 className="text-2xl font-extrabold text-slate-900">Ringkasan Eksekutif</h3>
               <p className="text-slate-500 text-sm">Intisari dari Publikasi SAID Volume I 2025.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: Text Analysis */}
            <div className="space-y-8">
               
               {/* Economy Brief */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-blue-700 font-bold text-lg mb-3 flex items-center">
                     <span className="bg-blue-100 p-1.5 rounded-lg mr-3">
                        <TrendingUp size={16} />
                     </span>
                     Kajian Ekonomi: Shift-Share
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                     Berdasarkan analisis, sektor <strong>Pertanian</strong> dan <strong>Industri Pengolahan</strong> masuk dalam Kuadran I (Progresif). Ini menunjukkan daya saing kuat. Sektor Jasa Perdagangan perlu dorongan lebih lanjut.
                  </p>
                  <div className="flex items-center text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-lg">
                     <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                     Key Insight: Hilirisasi produk pertanian adalah kunci pertumbuhan masa depan.
                  </div>
               </div>

               {/* Poverty Brief */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-rose-700 font-bold text-lg mb-3 flex items-center">
                     <span className="bg-rose-100 p-1.5 rounded-lg mr-3">
                        <Activity size={16} />
                     </span>
                     Kajian Kemiskinan: Indeks FGT
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                     Indeks Kedalaman (P1) dan Keparahan (P2) kemiskinan menunjukkan penurunan. Ini mengindikasikan bahwa rata-rata pengeluaran penduduk miskin semakin mendekati Garis Kemiskinan, dan ketimpangan antar penduduk miskin mengecil.
                  </p>
                  <div className="flex items-center text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-lg">
                     <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                     Key Insight: Program bantuan sosial tepat sasaran berhasil mengurangi kedalaman kemiskinan.
                  </div>
               </div>

            </div>

            {/* Right Column: Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
               <div className="mb-6 flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">Visualisasi Makro</h5>
                  <div className="flex space-x-2">
                      <span className="px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">Ekonomi</span>
                  </div>
               </div>
               
               <div className="h-64 w-full">
                  {/* We pass all data to the client chart component */}
                  <HomeChart data={allData} />
               </div>

               <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-500 mb-1">Catatan</p>
                  <p className="text-xs text-slate-400">Data PDRB dan Pertumbuhan diolah dari BPS Kabupaten Majene.</p>
               </div>
            </div>

         </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-6 text-center text-xs">
            <p className="mb-2">© 2025 Badan Pusat Statistik Kabupaten Majene. Sumber data: Publikasi SAID Volume I 2025.</p>
            <p className="text-slate-600">Dikembangkan oleh Tim IPDS BPS Majene.</p>
         </div>
      </footer>
    </div>
  );
}