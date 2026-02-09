'use client';

import { useState, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { Download, Calendar, TrendingUp, Activity, PieChart, Layers } from 'lucide-react';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, 
  Title, Tooltip, Legend, Filler, ScatterController
);

interface EconomyDashboardProps {
  data: any[];
}

export default function EconomyDashboard({ data }: EconomyDashboardProps) {
  // 1. DATA PROCESSING & GROUPING
  // We identify variables by name keywords to be robust
  const growthData = data.filter(d => d.variable_name?.toLowerCase().includes('laju') || d.variable_name?.toLowerCase().includes('pertumbuhan'));
  const adhkData = data.filter(d => d.variable_name?.toLowerCase().includes('adhk'));
  const adhbData = data.filter(d => d.variable_name?.toLowerCase().includes('adhb') && !d.variable_name?.toLowerCase().includes('distribusi'));
  
  // Sector Data (Look for 'Distribusi' or sector codes)
  const sectorDataRaw = data.filter(d => d.variable_name?.toLowerCase().includes('distribusi') || d.variable_name?.toLowerCase().includes('sektor'));

  // Get all unique years
  const allYears = Array.from(new Set(data.map(d => d.Tahun))).sort();
  
  // 2. STATE MANAGEMENT
  const [startYear, setStartYear] = useState(allYears[0] || '2010');
  const [endYear, setEndYear] = useState(allYears[allYears.length - 1] || '2024');
  const [focusYear, setFocusYear] = useState(allYears[allYears.length - 1] || '2024');

  // 3. FILTER LOGIC
  const filteredYears = allYears.filter(y => y >= startYear && y <= endYear);

  const getSeriesData = (dataset: any[]) => {
    return filteredYears.map(year => {
      const item = dataset.find(d => d.Tahun === year);
      // Handle comma decimals
      return item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
    });
  };

  const getFocusValue = (dataset: any[]) => {
    const item = dataset.find(d => d.Tahun === focusYear);
    const val = item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
    return val.toLocaleString('id-ID'); // Format 4.000
  };

  const getTrend = (dataset: any[]) => {
    const curr = dataset.find(d => d.Tahun === focusYear);
    const prevYear = String(Number(focusYear) - 1);
    const prev = dataset.find(d => d.Tahun === prevYear);

    const currVal = curr ? parseFloat(String(curr.Nilai).replace(',', '.')) : 0;
    const prevVal = prev ? parseFloat(String(prev.Nilai).replace(',', '.')) : 0;
    
    const diff = (currVal - prevVal).toFixed(2);
    return { val: diff, dir: currVal >= prevVal ? 'up' : 'down' };
  };

  // 4. CHART CONFIGS
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { ticks: { font: { size: 11 } }, grid: { color: '#f1f5f9' } }
    }
  };

  // Refs for download
  const growthRef = useRef<any>(null);
  const adhkRef = useRef<any>(null);
  const adhbRef = useRef<any>(null);

  const downloadChart = (ref: any, name: string) => {
    if (ref.current) {
      const link = document.createElement('a');
      link.download = `${name}_${focusYear}.png`;
      link.href = ref.current.toBase64Image();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="bg-white/80 backdrop-blur sticky top-16 z-30 border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
             <h2 className="text-2xl font-extrabold text-slate-900">Kinerja Perekonomian Makro</h2>
             <p className="text-sm text-slate-500 mt-1">Gambaran Umum, Tren Pertumbuhan & Struktur Ekonomi</p>
          </div>
          
          <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">Tahun Sorotan:</span>
             <select 
               value={focusYear} 
               onChange={(e) => setFocusYear(e.target.value)}
               className="bg-blue-50 text-blue-700 text-sm font-bold py-1.5 px-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
             >
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1: Growth */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pertumbuhan</p>
                <span className={`text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1 ${getTrend(growthData).dir === 'up' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                   {getTrend(growthData).dir === 'up' ? <TrendingUp size={12}/> : <Activity size={12}/>}
                   {getTrend(growthData).val}
                </span>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(growthData)}%</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Year on Year (y-o-y)</p>
          </div>

          {/* Card 2: ADHK */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDRB ADHK (Riil)</p>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(adhkData)}</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Miliar Rupiah</p>
          </div>

          {/* Card 3: ADHB */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PDRB ADHB (Nominal)</p>
             </div>
             <h3 className="text-3xl font-black text-slate-900">{getFocusValue(adhbData)}</h3>
             <p className="text-xs text-slate-400 mt-2 font-medium">Miliar Rupiah</p>
          </div>

          {/* Card 4: Dominant Sector (Placeholder logic) */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
             <div className="mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sektor Dominan</p>
             </div>
             <h3 className="text-2xl font-black text-slate-900 truncate">Pertanian</h3>
             <p className="text-xs text-slate-500 mt-2 font-bold">Kontribusi: ~35%</p>
          </div>
        </div>

        {/* TIME SERIES CONTROLS */}
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
            <div className="h-px bg-slate-200 grow ml-6 hidden sm:block"></div>
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Chart 1: Growth */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-orange-500 rounded-sm mr-3"></span>
                     Tren Laju Pertumbuhan Ekonomi (%)
                  </h4>
                  <button onClick={() => downloadChart(growthRef, 'growth')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} /> Unduh
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Line 
                    ref={growthRef}
                    data={{
                      labels: filteredYears,
                      datasets: [{
                        label: 'Pertumbuhan',
                        data: getSeriesData(growthData),
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#f97316',
                        pointRadius: 5,
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={commonOptions}
                  />
               </div>
            </div>

            {/* Chart 2: ADHK */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-blue-600 rounded-sm mr-3"></span>
                     Tren PDRB ADHK (Miliar Rp)
                  </h4>
                  <button onClick={() => downloadChart(adhkRef, 'adhk')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} /> Unduh
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Bar 
                    ref={adhkRef}
                    data={{
                      labels: filteredYears,
                      datasets: [{
                        label: 'PDRB ADHK',
                        data: getSeriesData(adhkData),
                        backgroundColor: '#2563eb',
                        borderRadius: 6,
                      }]
                    }}
                    options={commonOptions}
                  />
               </div>
            </div>

             {/* Chart 3: ADHB */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-emerald-500 rounded-sm mr-3"></span>
                     Tren PDRB ADHB (Miliar Rp)
                  </h4>
                  <button onClick={() => downloadChart(adhbRef, 'adhb')} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-2 transition-colors">
                     <Download size={14} /> Unduh
                  </button>
               </div>
               <div className="h-72 w-full">
                  <Line 
                    ref={adhbRef}
                    data={{
                      labels: filteredYears,
                      datasets: [{
                        label: 'PDRB ADHB',
                        data: getSeriesData(adhbData),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#10b981',
                        pointRadius: 5,
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={commonOptions}
                  />
               </div>
            </div>

            {/* Shift Share Placeholder (Since we need coordinate data) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 col-span-1 lg:col-span-1">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-5 bg-purple-500 rounded-sm mr-3"></span>
                     Analisis Shift Share (Simulasi)
                  </h4>
               </div>
               <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                   <div className="text-center p-6">
                      <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">Visualisasi Kuadran Shift-Share</p>
                      <p className="text-xs text-slate-400 mt-1">Data koordinat sektor belum tersedia di spreadsheet.</p>
                   </div>
               </div>
            </div>

        </div>

      </div>
    </div>
  );
}