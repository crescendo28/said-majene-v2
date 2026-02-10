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
  Filler,
  TooltipItem,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Download, Calendar, TrendingUp, TrendingDown, Minus, Activity
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
  
  // Get all unique years and sort them
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

  const getPieData = (varId: string) => {
      const varRows = dataByVar[varId] || [];
      const items = varRows.filter(d => d.Tahun === focusYear);
      
      const labels = items.map(i => i.kategori_data || i.Kategori || i.variable_name);
      const values = items.map(i => parseFloat(String(i.Nilai).replace(',', '.')));
      
      return { labels, values };
  };

  const getFocusValue = (varId: string) => {
    const varRows = dataByVar[varId] || [];
    const items = varRows.filter(d => d.Tahun === focusYear);
    if (items.length === 0) return { val: '-', unit: '' };

    // Try to find "Total" or similar, else take first
    const totalItem = items.find(i => /total|jumlah/i.test(i.kategori_data || '')) || items[0];
    
    const val = parseFloat(String(totalItem.Nilai).replace(',', '.'));
    return { val: val.toLocaleString('id-ID', { maximumFractionDigits: 2 }), unit: totalItem.Satuan };
  };

  const getTrend = (varId: string, trendLogic: string = 'UpIsGood') => {
    const varRows = dataByVar[varId] || [];
    
    const getRep = (y: string) => {
        const items = varRows.filter(d => d.Tahun === y);
        return items.find(i => /total|jumlah/i.test(i.kategori_data || '')) || items[0];
    };

    const currItem = getRep(focusYear);
    const prevYearIndex = allYears.indexOf(focusYear) - 1;
    const prevYear = prevYearIndex >= 0 ? allYears[prevYearIndex] : null;
    const prevItem = prevYear ? getRep(prevYear) : null;

    if (!currItem || !prevItem) return { diff: '0.0%', dir: 'flat', color: 'bg-slate-100 text-slate-500', text: 'Stagnan' };

    const curr = parseFloat(String(currItem.Nilai).replace(',', '.'));
    const prev = parseFloat(String(prevItem.Nilai).replace(',', '.'));
    
    if (prev === 0) return { diff: 'N/A', dir: 'flat', color: 'bg-slate-100 text-slate-500', text: 'N/A' };

    const diff = ((curr - prev) / prev) * 100;
    const absDiff = Math.abs(diff).toFixed(1) + '%';

    let color = 'bg-slate-100 text-slate-500';
    if (diff > 0) color = trendLogic === 'UpIsGood' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
    if (diff < 0) color = trendLogic === 'DownIsGood' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';

    return { 
        diff: absDiff, 
        dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', 
        color,
        text: diff > 0 ? 'Naik' : diff < 0 ? 'Turun' : 'Tetap'
    };
  };

  const getColorHex = (colorName: string) => {
      const map: Record<string, string> = {
          'blue': '#3b82f6', 'emerald': '#10b981', 'rose': '#f43f5e', 
          'orange': '#f97316', 'purple': '#8b5cf6', 'indigo': '#6366f1'
      };
      return map[colorName] || '#3b82f6';
  };

  const downloadChart = (chartId: string, label: string) => {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${category}_${label}_${focusYear}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
  };

  // --- UI RENDER ---

  // Helper to create options - we return 'any' or a broad type, then cast at usage site
  // This approach is much cleaner for the compiler than complex generics here.
  const createChartOptions = (unit: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: { display: false }, 
        tooltip: { 
            enabled: true,
            mode: 'index' as const,
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#e2e8f0',
            bodyColor: '#fff',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            callbacks: {
                label: function(context: any) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) {
                        label += new Intl.NumberFormat('id-ID').format(context.parsed.y) + ' ' + unit;
                    }
                    return label;
                }
            }
        } 
    },
    scales: {
      x: { 
        display: true, 
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      }, 
      y: { 
        display: true, 
        position: 'right' as const,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 }, color: '#cbd5e1', count: 3 }
      }
    },
    layout: { padding: 10 }
  });

  const createPieOptions = (unit: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: true, position: 'right' as const, labels: { boxWidth: 10, font: { size: 11 } } },
        tooltip: {
            callbacks: {
                label: function(context: any) {
                    const val = context.parsed;
                    return new Intl.NumberFormat('id-ID').format(val) + ' ' + unit;
                }
            }
        }
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      
      {/* GLOBAL CONTROLS (Sticky) */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          
          {/* Title Section */}
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">Kategori</span>
                <h2 className="text-2xl font-extrabold text-slate-900 capitalize">{category}</h2>
             </div>
             <p className="text-sm text-slate-500">Memantau <span className="font-bold text-slate-900">{safeMeta.length} Indikator</span> strategis</p>
          </div>
          
          {/* Controls Section */}
          <div className="flex flex-wrap items-center gap-3">
             {/* Time Range */}
             <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 px-2 uppercase flex items-center gap-1">
                    <Calendar size={12}/> Tren
                </span>
                <select 
                    value={startYear} 
                    onChange={(e) => setStartYear(e.target.value)} 
                    className="bg-slate-50 border-0 text-slate-700 text-sm font-bold py-1 px-2 rounded focus:ring-0 cursor-pointer hover:bg-slate-100 outline-none"
                >
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300">-</span>
                <select 
                    value={endYear} 
                    onChange={(e) => setEndYear(e.target.value)} 
                    className="bg-slate-50 border-0 text-slate-700 text-sm font-bold py-1 px-2 rounded focus:ring-0 cursor-pointer hover:bg-slate-100 outline-none"
                >
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>

             {/* Focus Year */}
             <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 px-2 uppercase">Sorotan</span>
                <select 
                    value={focusYear} 
                    onChange={(e) => setFocusYear(e.target.value)} 
                    className="bg-white border-0 text-indigo-700 text-sm font-bold py-1 px-3 rounded shadow-sm focus:ring-0 cursor-pointer outline-none"
                >
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 grow w-full">
        {safeMeta.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-slate-400">Tidak ada indikator yang ditemukan untuk kategori ini.</p>
            </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {safeMeta.map((variable, i) => {
                const id = variable.Id;
                const label = variable.Label;
                const desc = variable.Deskripsi;
                const chartType = variable.TipeGrafik ? variable.TipeGrafik.toLowerCase() : 'line';
                const themeColor = variable.Warna || 'blue';
                const trendLogic = variable.TrendLogic || 'UpIsGood';
                
                const { val, unit } = getFocusValue(id);
                const trend = getTrend(id, trendLogic);
                const hexColor = getColorHex(themeColor);
                
                // Chart Data Construction
                let chartElement = null;

                if (chartType === 'line') {
                    const data = {
                        labels: filteredYears,
                        datasets: [{
                            label: label,
                            data: getSeriesData(id),
                            borderColor: hexColor,
                            backgroundColor: `${hexColor}1A`,
                            fill: true,
                            tension: 0.3,
                            borderWidth: 3,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            hoverBackgroundColor: hexColor
                        }]
                    };
                    const options = createChartOptions(unit);
                    chartElement = <Line id={`chart-${id}`} data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
                } 
                else if (chartType === 'bar') {
                    const data = {
                        labels: filteredYears,
                        datasets: [{
                            label: label,
                            data: getSeriesData(id),
                            backgroundColor: hexColor,
                            borderRadius: 4,
                            borderWidth: 0,
                            hoverBackgroundColor: hexColor
                        }]
                    };
                    const options = createChartOptions(unit);
                    chartElement = <Bar id={`chart-${id}`} data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
                } 
                else if (chartType === 'doughnut') {
                    const { labels, values } = getPieData(id);
                    const data = {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: [
                                '#3b82f6', '#10b981', '#f43f5e', '#f97316', '#8b5cf6', 
                                '#06b6d4', '#84cc16', '#d946ef', '#64748b'
                            ],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    };
                    const options = createPieOptions(unit);
                    chartElement = <Doughnut id={`chart-${id}`} data={data as ChartData<'doughnut'>} options={options as ChartOptions<'doughnut'>} />;
                } 
                else if (chartType === 'pie') {
                    const { labels, values } = getPieData(id);
                    const data = {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: [
                                '#3b82f6', '#10b981', '#f43f5e', '#f97316', '#8b5cf6', 
                                '#06b6d4', '#84cc16', '#d946ef', '#64748b'
                            ],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    };
                    const options = createPieOptions(unit);
                    chartElement = <Pie id={`chart-${id}`} data={data as ChartData<'pie'>} options={options as ChartOptions<'pie'>} />;
                }

                return (
                    <div key={id} className="bg-white rounded-[20px] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-7 flex flex-col group h-full">
                        
                        {/* 1. Variable Name + Growth */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${themeColor}-50 text-${themeColor}-600`}>
                                    <Activity size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight pr-4">
                                    {label}
                                </h3>
                            </div>
                            
                            {trend.diff !== 'N/A' && (
                                <div className={`flex flex-col items-end shrink-0 ${trend.color} px-3 py-1.5 rounded-lg`}>
                                    <div className="flex items-center gap-1 text-xs font-bold">
                                        {trend.dir === 'up' && <TrendingUp size={14}/>}
                                        {trend.dir === 'down' && <TrendingDown size={14}/>}
                                        {trend.dir === 'flat' && <Minus size={14}/>}
                                        <span>{trend.text} {trend.diff}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Current Number + Year */}
                        <div className="flex items-end gap-3 mb-6 pb-6 border-b border-slate-100">
                            <span className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                                {val}
                            </span>
                            <div className="flex flex-col mb-1">
                                <span className="text-sm font-bold text-slate-500">{unit}</span>
                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                                    Tahun {focusYear}
                                </span>
                            </div>
                        </div>

                        {/* 3. Description */}
                        {desc && (
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                {desc}
                            </p>
                        )}

                        {/* 4. Chart */}
                        <div className="mt-auto h-64 w-full relative flex items-center justify-center">
                            <div className="absolute top-0 right-0 z-10">
                                <button 
                                    onClick={() => downloadChart(`chart-${id}`, label)} 
                                    className="text-slate-400 hover:text-indigo-600 transition p-1 bg-white/80 rounded-full"
                                    title="Download Chart"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                            {chartElement}
                        </div>

                    </div>
                );
            })}
        </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-slate-50 text-center">
        <p className="text-xs text-slate-400">© 2025 BPS Kabupaten Majene. Sumber Data: BPS Web API.</p>
      </footer>
    </div>
  );
}