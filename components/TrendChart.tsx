'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TrendChart({ data }: { data: any[] }) {
  const safeData = Array.isArray(data) ? data : [];
  
  if (safeData.length === 0) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-slate-500 text-center">
        No data available for charts.
      </div>
    );
  }

  // Pick the Variable Name to show in legend
  const variableName = safeData[0]?.variable_name || safeData[0]?.Label || 'Value';
  
  // Sort by year
  const sorted = [...safeData].sort((a, b) => Number(a.Tahun) - Number(b.Tahun));
  
  const chartData = {
    labels: sorted.map(d => d.Tahun),
    datasets: [
      {
        label: variableName,
        data: sorted.map(d => {
            // Handle "10,5" string format if present
            const val = String(d.Nilai || 0).replace(',', '.');
            return parseFloat(val);
        }),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#cbd5e1' } },
    },
    scales: {
      y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
    },
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
      <Line options={options} data={chartData} />
    </div>
  );
}