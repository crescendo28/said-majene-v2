'use client';

import { 
  TrendingUp, TrendingDown, Minus,
  BarChart3, PieChart, Activity, Info
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Filler
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface HomeIndicatorCardProps {
  meta: any;
  history: any[];
}

export default function HomeIndicatorCard({ meta, history = [] }: HomeIndicatorCardProps) {
  const { Label, Kategori, TargetRPJMD, TrendLogic, Warna, Deskripsi } = meta;

  // 1. Data Processing
  // Sort history by year ascending for the chart
  const sortedHistory = [...history].sort((a, b) => Number(a.Tahun) - Number(b.Tahun));
  const latest = sortedHistory[sortedHistory.length - 1];
  const prev = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;

  if (!latest) return null;

  const val = parseFloat(String(latest.Nilai).replace(',', '.'));
  const prevVal = prev ? parseFloat(String(prev.Nilai).replace(',', '.')) : 0;
  const unit = latest.Satuan;
  const year = latest.Tahun;

  // 2. Trend Calculation
  let diff = 0;
  let diffPercent = 0;
  let trendDirection = 'flat';

  if (prev) {
      diff = val - prevVal;
      diffPercent = (diff / prevVal) * 100;
      if (diff > 0) trendDirection = 'up';
      if (diff < 0) trendDirection = 'down';
  }

  // 3. Status Logic (Good/Bad) based on TrendLogic
  let isGoodTrend = false;
  if (TrendLogic === 'DownIsGood') {
      isGoodTrend = trendDirection === 'down';
  } else {
      // Default UpIsGood
      isGoodTrend = trendDirection === 'up';
  }
  
  // 4. Styles & Theme
  const getTheme = (c: string) => {
      const map: any = {
          blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', link: 'text-blue-600', hex: '#2563eb' },
          emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', link: 'text-emerald-600', hex: '#059669' },
          rose: { iconBg: 'bg-rose-50', iconText: 'text-rose-600', link: 'text-rose-600', hex: '#e11d48' },
          orange: { iconBg: 'bg-orange-50', iconText: 'text-orange-600', link: 'text-orange-600', hex: '#ea580c' },
          purple: { iconBg: 'bg-purple-50', iconText: 'text-purple-600', link: 'text-purple-600', hex: '#7c3aed' },
          indigo: { iconBg: 'bg-indigo-50', iconText: 'text-indigo-600', link: 'text-indigo-600', hex: '#4f46e5' },
      };
      return map[c] || map.blue;
  };
  const theme = getTheme(Warna || 'blue');

  // Specific Colors for Change & Target
  const trendColor = isGoodTrend ? 'text-emerald-500' : 'text-rose-500';
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={16}/> : trendDirection === 'down' ? <TrendingDown size={16}/> : <Minus size={16}/>;
  const trendText = trendDirection === 'up' ? 'Naik' : trendDirection === 'down' ? 'Turun' : 'Tetap';

  // Target Box Theme
  const targetTheme = isGoodTrend 
    ? 'bg-[#eafff8] border-[#7ceecf] text-[#12c29a]' // Green-ish
    : 'bg-[#ffecec] border-[#ffb3b3] text-[#ff2e2e]'; // Red-ish

  // 5. Chart Data (Sparkline)
  const chartData = {
    labels: sortedHistory.map(h => h.Tahun),
    datasets: [{
      data: sortedHistory.map(h => parseFloat(String(h.Nilai).replace(',', '.'))),
      borderColor: theme.hex,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, `${theme.hex}33`); 
        gradient.addColorStop(1, `${theme.hex}00`); 
        return gradient;
      },
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true, intersect: false } },
    scales: { x: { display: false }, y: { display: false } },
    layout: { padding: 0 }
  };

  return (
    <div className="bg-white rounded-[18px] p-[26px] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col h-full w-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* HEADER: Icon+Title left, Link right */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg font-bold ${theme.iconBg} ${theme.iconText} flex-shrink-0`}>
                {meta.TipeGrafik === 'pie' ? <PieChart size={20}/> : meta.TipeGrafik === 'bar' ? <BarChart3 size={20}/> : <Activity size={20}/>}
            </div>
            
            {/* Text */}
            <div className="flex-1">
                <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">{Kategori}</h3>
                <p className="text-[12px] mt-1 text-[#7c8aa5] font-bold tracking-[0.6px] uppercase leading-snug">{Label}</p>
            </div>
        </div>

        {/* Dashboard Link */}
        <Link 
            href={`/dashboard/${Kategori.toLowerCase()}`} 
            className={`text-[13px] font-bold ${theme.link} hover:opacity-70 transition-opacity flex items-center gap-1 flex-shrink-0 ml-2`}
        >
            Dashboard ↗
        </Link>
      </div>

      {/* METRIC GRID */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mt-2">
          
          {/* Left: Value */}
          <div className="flex-1">
              <div className="text-[12px] font-extrabold text-[#7c8aa5] mb-2 tracking-[0.6px] uppercase">Realisasi {year}</div>
              <div className="flex items-baseline gap-1">
                  <span className="text-[42px] font-black text-[#0d152a] leading-none">
                    {val.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[16px] font-extrabold text-[#7c8aa5]">{unit}</span>
              </div>

              {/* Change Badge */}
              {prev && (
                <div className={`mt-2.5 text-[13px] font-bold flex items-center gap-1.5 ${trendColor}`}>
                    {trendIcon}
                    <span>{trendText} {Math.abs(diffPercent).toFixed(1)}% dari tahun lalu</span>
                </div>
              )}
          </div>

          {/* Right: Target */}
          {TargetRPJMD && (
            <div className="text-right w-full sm:w-auto mt-4 sm:mt-0">
                <div className="text-[12px] font-extrabold text-[#7c8aa5] mb-2 tracking-[0.6px] uppercase">Target RPJMD</div>
                <div className={`py-3 px-4 rounded-[10px] text-[14px] font-black text-center min-w-[140px] border-2 ${targetTheme}`}>
                    {TargetRPJMD}
                </div>
            </div>
          )}
      </div>

      {/* GRAPH ADDITION */}
      {sortedHistory.length > 1 && (
        <div className="h-16 w-full mt-6 opacity-90">
            <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* DIVIDER */}
      <div className="w-full h-px bg-[rgba(0,0,0,0.08)] my-5"></div>

      {/* DESCRIPTION */}
      <div className="flex items-start gap-2 relative group/desc cursor-help">
         <Info size={14} className="text-slate-400 mt-1 flex-shrink-0"/>
         <p className="text-[14px] text-[#66758e] leading-[1.6] line-clamp-3">
            {Deskripsi || "Indikator strategis daerah yang dipantau khusus pencapaiannya."}
         </p>
         {/* Tooltip for full text */}
         <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-all z-20 pointer-events-none">
            {Deskripsi}
         </div>
      </div>

    </div>
  );
}