'use client';

import { Activity, TrendingDown, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import HomeChart from './HomeChart';

export default function HomeIndicatorCard({ meta, history }: { meta: any, history: any[] }) {
  if (!meta || !history) return null;

  const isUpGood = meta.TrendLogic !== 'DownIsGood';
  const indicatorData = history;

  let latestValueString = '0';
  let latestValue = 0;
  let previousValue = 0;
  let trend = 0;
  let trendPercentage = 0;
  let unit = '';

  if (indicatorData.length > 0) {
    const latestRecord = indicatorData[indicatorData.length - 1];
    
    // Show exact string (e.g. "12,98")
    latestValueString = latestRecord.Nilai || '0';
    // Parse it properly for Math ("12,98" -> 12.98)
    latestValue = parseFloat(String(latestRecord.Nilai).replace(/,/g, '.')) || 0;
    unit = latestRecord.Satuan || '';

    if (indicatorData.length > 1) {
      const prevRecord = indicatorData[indicatorData.length - 2];
      previousValue = parseFloat(String(prevRecord.Nilai).replace(/,/g, '.')) || 0;
      trend = latestValue - previousValue;
      if (previousValue !== 0) {
        trendPercentage = (trend / previousValue) * 100;
      }
    }
  }

  // Determine trend color
  const isPositiveTrend = trend > 0;
  const isGood = isUpGood ? isPositiveTrend : !isPositiveTrend;
  
  let trendColor = 'text-slate-500';
  if (trend !== 0) {
    trendColor = isGood ? 'text-emerald-500' : 'text-rose-500';
  }

  return (
    <div className="bg-white rounded-[18px] p-[26px] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-slate-100/50 flex flex-col h-full w-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg font-bold bg-blue-50 text-blue-600 flex-shrink-0">
            <Activity size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">
              {meta.Kategori}
            </h3>
            <p className="text-[12px] mt-1 text-[#7c8aa5] font-bold tracking-[0.6px] uppercase leading-snug">
              {meta.Label}
            </p>
          </div>
        </div>
        <Link 
          href={`/dashboard/${meta.Kategori?.toLowerCase()}`}
          className="text-[13px] font-bold text-blue-600 hover:opacity-70 transition-opacity flex items-center gap-1 flex-shrink-0 ml-2"
        >
          Dashboard ↗
        </Link>
      </div>

      {/* NUMBERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mt-2">
        <div className="flex-1">
          <div className="text-[12px] font-extrabold text-[#7c8aa5] mb-2 tracking-[0.6px] uppercase">
            Realisasi {indicatorData[indicatorData.length - 1]?.Tahun || ''}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[42px] font-black text-[#0d152a] leading-none">
               {latestValueString}
            </span>
            <span className="text-[16px] font-extrabold text-[#7c8aa5]">
              {unit}
            </span>
          </div>
          <div className={`mt-2.5 text-[13px] font-bold flex items-center gap-1.5 ${trendColor}`}>
            {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : null}
            <span>
              {trend === 0 
                ? 'Tidak ada perubahan' 
                : `${trend > 0 ? 'Naik' : 'Turun'} ${Math.abs(trendPercentage).toFixed(1)}% dari tahun lalu`}
            </span>
          </div>
        </div>

        {meta.TargetRPJMD && (
          <div className="text-right w-full sm:w-auto mt-4 sm:mt-0">
            <div className="text-[12px] font-extrabold text-[#7c8aa5] mb-2 tracking-[0.6px] uppercase">
              Target RPJMD
            </div>
            <div className="py-3 px-4 rounded-[10px] text-[14px] font-black text-center min-w-[140px] border-2 bg-[#eafff8] border-[#7ceecf] text-[#12c29a]">
              {meta.TargetRPJMD}
            </div>
          </div>
        )}
      </div>

      {/* DESCRIPTION - No tooltip, just a clean box above the graph */}
      {meta.Deskripsi && (
        <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
          <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
            {meta.Deskripsi}
          </p>
        </div>
      )}

      {/* TALLER CHART - Set to 160px height so the trend lines are easily visible */}
      <div className="h-[160px] w-full mt-6 opacity-100 relative mt-auto shrink-0">
        <HomeChart data={indicatorData} />
      </div>

    </div>
  );
}