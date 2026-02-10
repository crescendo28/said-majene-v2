'use client';

import { useState, useMemo } from 'react';
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
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Download, Calendar, TrendingUp, TrendingDown, Minus, Info
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface GenericDashboardProps {
  data: any[];
  meta: any[];
  category: string;
}

export default function GenericDashboard({ data = [], meta = [], category }: GenericDashboardProps) {
  const safeData = Array.isArray(data) ? data : [];
  const safeMeta = Array.isArray(meta) ? meta : [];
  const allYears = Array.from(new Set(safeData.map(d => d.Tahun))).sort();
  
  const dataByVar = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    safeData.forEach(row => {
      const id = row.id_variable;
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(row);
    });
    return grouped;
  }, [safeData]);

  // Default to last 5 years range if available, otherwise all
  const initialStart = allYears.length > 5 ? allYears[allYears.length - 5] : allYears[0];
  const [startYear, setStartYear] = useState(initialStart || '2020');
  const [endYear, setEndYear] = useState(allYears[allYears.length - 1] || '2024');
  const [focusYear, setFocusYear] = useState(allYears[allYears.length - 1] || '2024');

  const filteredYears = allYears.filter(y => y >= startYear && y <= endYear);

  // --- HELPER LOGIC ---

  const getSeriesData = (varId: string) => {
    const varRows = dataByVar[varId] || [];
    return filteredYears.map(year => {
      const item = varRows.find(d => d.Tahun === year);
      return item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
    });
  };

  const getFocusValue = (varId: string) => {
    const varRows = dataByVar[varId] || [];
    const item = varRows.find(d => d.Tahun === focusYear);
    if (!item) return { val: '-', unit: '' };
    const val = parseFloat(String(item.Nilai).replace(',', '.'));
    return { val: val.toLocaleString('id-ID', { maximumFractionDigits: 2 }), unit: item.Satuan };
  };

  const getTrend = (varId: string, trendLogic: string = 'UpIsGood') => {
    const varRows = dataByVar[varId] || [];
    const currItem = varRows.find(d => d.Tahun === focusYear);
    const prevYear = String(Number(focusYear) - 1);
    const prevItem = varRows.find(d => d.Tahun === prevYear);

    if (!currItem || !prevItem) return { diff: 0, dir: 'flat', color: 'bg-slate-100 text-slate-500' };

    const curr = parseFloat(String(currItem.Nilai).replace(',', '.'));
    const prev = parseFloat(String(prevItem.Nilai).replace(',', '.'));
    const diff = ((curr - prev) / prev) * 100; // Percentage change
    const absDiff = Math.abs(diff).toFixed(1);

    let color = 'bg-slate-100 text-slate-500';
    // Logic for UpIsGood (Green Up, Red Down) vs DownIsGood (Green Down, Red Up)
    if (diff > 0) color = trendLogic === 'UpIsGood' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
    if (diff < 0) color = trendLogic === 'DownIsGood' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';

    return { 
        diff: `${absDiff}%`, 
        dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', 
        color 
    };
  };

  const getColorHex = (colorName: string) => {
      const map: Record<string, string> = {
          'blue': '#3b82f6', 'emerald': '#10b981', 'rose': '#f43f5e', 
          'orange': '#f97316', 'purple': '#8b5cf6', 'indigo': '#6366f1'
      };
      return map[colorName] || '#3b82f6';
  };

  // --- UI RENDER ---

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false }, 
      y: { display: false } // Sparkline look
    },
    elements: {
        point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
        line: { tension: 0.4, borderWidth: 3 }
    }
  };

  const downloadChart = (chartId: string) => {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${category}_${chartId}_${focusYear}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-12">
      
      {/* GLOBAL CONTROLS (Sticky) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">Kategori</span>
                <h2 className="text-2xl font-extrabold text-slate-900 capitalize">{category}</h2>
             </div>
             <p className="text-sm text-slate-500">Memantau <span className="font-bold text-slate-900">{safeMeta.length} Indikator</span> strategis</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* Time Range */}
             <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 px-2 uppercase flex items-center gap-1">
                    <Calendar size={12}/> Tren
                </span>
                <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="bg-slate-50 border-0 text-slate-700 text-sm font-bold py-1 px-2 rounded focus:ring-0 cursor-pointer hover:bg-slate-100">
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300">-</span>
                <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="bg-slate-50 border-0 text-slate-700 text-sm font-bold py-1 px-2 rounded focus:ring-0 cursor-pointer hover:bg-slate-100">
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>

             {/* Focus Year */}
             <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 px-2 uppercase">Sorotan</span>
                <select value={focusYear} onChange={(e) => setFocusYear(e.target.value)} className="bg-white border-0 text-indigo-700 text-sm font-bold py-1 px-3 rounded shadow-sm focus:ring-0 cursor-pointer">
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {safeMeta.map((variable, i) => {
                const id = variable.Id;
                const label = variable.Label;
                const desc = variable.Deskripsi;
                const chartType = variable.TipeGrafik || 'line';
                const themeColor = variable.Warna || 'blue'; // From new Config
                const trendLogic = variable.TrendLogic || 'UpIsGood'; // From new Config
                
                const { val, unit } = getFocusValue(id);
                const trend = getTrend(id, trendLogic);
                const hexColor = getColorHex(themeColor);
                const bg = `${hexColor}1A`; // 10% opacity

                // Chart Data Logic
                const chartData = {
                    labels: filteredYears,
                    datasets: [{
                        data: getSeriesData(id),
                        borderColor: hexColor,
                        backgroundColor: chartType === 'line' ? bg : hexColor,
                        fill: true,
                        borderRadius: 4
                    }]
                };

                return (
                    <div key={id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        
                        {/* Header (Value) */}
                        <div className="p-6 border-b border-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-tight line-clamp-2 h-10" title={label}>
                                    {label}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${trend.color}`}>
                                    {trend.dir === 'up' && <TrendingUp size={12}/>}
                                    {trend.dir === 'down' && <TrendingDown size={12}/>}
                                    {trend.dir === 'flat' && <Minus size={12}/>}
                                    {trend.diff}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-4xl font-black text-slate-900">{val}</span>
                                <span className="text-xs text-slate-400 font-bold">{unit}</span>
                            </div>
                        </div>

                        {/* Chart Body */}
                        <div className="p-4 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Tren {startYear}-{endYear}</span>
                                <button onClick={() => downloadChart(`chart-${id}`)} className="text-slate-400 hover:text-indigo-600 transition">
                                    <Download size={14} />
                                </button>
                            </div>
                            <div className="h-32 w-full">
                                {chartType === 'line' && <Line id={`chart-${id}`} data={chartData} options={commonOptions} />}
                                {chartType === 'bar' && <Bar id={`chart-${id}`} data={chartData} options={commonOptions} />}
                                {chartType === 'doughnut' && <Doughnut id={`chart-${id}`} data={chartData} options={{...commonOptions, scales:{}}} />}
                            </div>
                        </div>

                        {/* Info Box (Only if description exists) */}
                        {desc && (
                            <div className="px-6 py-3 bg-yellow-50/50 border-t border-yellow-100 flex items-start gap-2">
                                <Info className="w-3 h-3 text-yellow-600 mt-1 flex-shrink-0" />
                                <p className="text-[10px] text-yellow-700 leading-relaxed italic line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                    "{desc}"
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

        </div>
      </div>
    </div>
  );
}