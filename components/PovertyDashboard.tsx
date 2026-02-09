'use client';

import { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Download, Calendar, Activity, TrendingDown } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  Title, Tooltip, Legend, Filler
);

interface PovertyDashboardProps {
  data: any[];
}

// CRITICAL FIX: We add " = []" here. This is the safety belt that stops the crash.
export default function PovertyDashboard({ data = [] }: PovertyDashboardProps) {
  // Extra layer of safety: Force it to be an array even if something goes wrong
  const safeData = Array.isArray(data) ? data : [];

  // Helper to safely check if a variable name matches a keyword
  const hasKeyword = (row: any, keyword: string) => {
    const name = row?.variable_name || row?.Label || '';
    return String(name).toLowerCase().includes(keyword.toLowerCase());
  };

  // 1. DATA PROCESSING
  const p0Data = safeData.filter(d => hasKeyword(d, 'persentase') || hasKeyword(d, 'p0'));
  const jumlahData = safeData.filter(d => hasKeyword(d, 'jumlah'));
  const p1Data = safeData.filter(d => hasKeyword(d, 'kedalaman') || hasKeyword(d, 'p1'));
  const p2Data = safeData.filter(d => hasKeyword(d, 'keparahan') || hasKeyword(d, 'p2'));

  // Get Unique Years
  const allYears = Array.from(new Set(safeData.map(d => d.Tahun))).sort();

  // 2. STATE
  const [startYear, setStartYear] = useState(allYears[0] || '2019');
  const [endYear, setEndYear] = useState(allYears[allYears.length - 1] || '2024');
  const [focusYear, setFocusYear] = useState(allYears[allYears.length - 1] || '2024');

  // 3. CHART HELPERS
  const filteredYears = allYears.filter(y => y >= startYear && y <= endYear);

  const getSeriesData = (dataset: any[]) => {
    return filteredYears.map(year => {
      const item = dataset.find(d => d.Tahun === year);
      return item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
    });
  };

  const getFocusValue = (dataset: any[]) => {
    const item = dataset.find(d => d.Tahun === focusYear);
    const val = item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
    return val.toLocaleString('id-ID');
  };

  const getTrend = (dataset: any[]) => {
    const curr = dataset.find(d => d.Tahun === focusYear);
    const prevYear = String(Number(focusYear) - 1);
    const prev = dataset.find(d => d.Tahun === prevYear);

    const currVal = curr ? parseFloat(String(curr.Nilai).replace(',', '.')) : 0;
    const prevVal = prev ? parseFloat(String(prev.Nilai).replace(',', '.')) : 0;
    
    const diff = (currVal - prevVal).toFixed(2);
    // For poverty, decreasing (negative diff) is GOOD
    const isGood = currVal < prevVal;
    
    return { 
      val: Math.abs(Number(diff)), 
      dir: currVal > prevVal ? 'up' : 'down',
      isGood 
    };
  };

  // Chart References for Download
  const p0Ref = useRef<any>(null);
  const jumlahRef = useRef<any>(null);
  const p1Ref = useRef<any>(null);
  const p2Ref = useRef<any>(null);

  const downloadChart = (ref: any, name: string) => {
    if (ref.current) {
      const link = document.createElement('a');
      link.download = `${name}_${focusYear}.png`;
      link.href = ref.current.toBase64Image();
      link.click();
    }
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } }
    }
  };

  // 4. EMPTY STATE (Prevent rendering empty charts)
  if (safeData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Activity className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold">Tidak ada data kemiskinan</h2>
        <p className="text-sm mt-2">Pastikan Google Sheet terhubung dan memiliki kategori "kemiskinan".</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur sticky top-16 z-30 border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
             <h2 className="text-2xl font-extrabold text-slate-900">Kondisi Kesejahteraan Sosial</h2>
             <p className="text-sm text-slate-500 mt-1">Analisis Indeks Foster-Greer-Thorbecke (FGT)</p>
          </div>
          <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">Tahun Sorotan:</span>
             <select 
               value={focusYear} 
               onChange={(e) => setFocusYear(e.target.value)}
               className="bg-red-50 text-red-700 text-sm font-bold py-1.5 px-3 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
             >
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-red-600 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persentase Penduduk Miskin</p>
                <span className={`text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1 ${getTrend(p0Data).isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                   {getTrend(p0Data).dir === 'down' ? <TrendingDown size={14} /> : <Activity size={14}/>}
                   {getTrend(p0Data).val}%
                </span>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(p0Data)}%</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Headcount Index (P0)</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 shadow-sm">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Penduduk Miskin</p>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(jumlahData)}</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Ribu Jiwa</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-500 shadow-sm">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indeks Kedalaman (P1)</p>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(p1Data)}</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Kesenjangan Rata-rata</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 shadow-sm">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indeks Keparahan (P2)</p>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(p2Data)}</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Ketimpangan Pengeluaran</p>
          </div>
        </div>

        {/* TIME CONTROLS */}
        <div className="flex items-center justify-between mb-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 inline-flex items-center space-x-3">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2 flex items-center gap-2">
                  <Calendar size={14}/> Rentang Waktu:
               </span>
               <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <select 
                    value={startYear} 
                    onChange={(e) => setStartYear(e.target.value)}
                    className="bg-transparent text-slate-700 text-sm font-bold py-1 px-2 focus:outline-none cursor-pointer"
                  >
                     {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span className="text-slate-400 text-sm font-bold">-</span>
                  <select 
                    value={endYear} 
                    onChange={(e) => setEndYear(e.target.value)}
                    className="bg-transparent text-slate-700 text-sm font-bold py-1 px-2 focus:outline-none cursor-pointer"
                  >
                     {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>
            <div className="h-px bg-slate-200 flex-grow ml-6 hidden sm:block"></div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Chart 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-red-600 rounded-sm mr-3"></span>
                     Tren P0 (%)
                  </h4>
                  <button onClick={() => downloadChart(p0Ref, 'p0')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} />
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Line ref={p0Ref} data={{ labels: filteredYears, datasets: [{ label: 'Persentase (%)', data: getSeriesData(p0Data), borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderWidth: 3, tension: 0.3, fill: true }] }} options={commonOptions} />
               </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-orange-500 rounded-sm mr-3"></span>
                     Tren Jumlah (Ribu)
                  </h4>
                  <button onClick={() => downloadChart(jumlahRef, 'jumlah')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} />
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Bar ref={jumlahRef} data={{ labels: filteredYears, datasets: [{ label: 'Penduduk Miskin', data: getSeriesData(jumlahData), backgroundColor: '#f97316', borderRadius: 6 }] }} options={commonOptions} />
               </div>
            </div>

             {/* Chart 3 */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-blue-500 rounded-sm mr-3"></span>
                     Tren P1 (Kedalaman)
                  </h4>
                  <button onClick={() => downloadChart(p1Ref, 'p1')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} />
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Line ref={p1Ref} data={{ labels: filteredYears, datasets: [{ label: 'Indeks P1', data: getSeriesData(p1Data), borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderWidth: 3, tension: 0.3, fill: true }] }} options={commonOptions} />
               </div>
            </div>

            {/* Chart 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-indigo-500 rounded-sm mr-3"></span>
                     Tren P2 (Keparahan)
                  </h4>
                  <button onClick={() => downloadChart(p2Ref, 'p2')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} />
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Line ref={p2Ref} data={{ labels: filteredYears, datasets: [{ label: 'Indeks P2', data: getSeriesData(p2Data), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 3, tension: 0.3, fill: true }] }} options={commonOptions} />
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}