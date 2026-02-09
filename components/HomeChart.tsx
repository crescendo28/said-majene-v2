'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function HomeChart({ data }: { data: any[] }) {
  // 1. Filter Data for specific variables
  // ID 43 = Laju Pertumbuhan (Line)
  // ID 41 = PDRB ADHK (Bar) - adjusting ID based on your screenshot context, 
  // if 41 isn't PDRB, we might need to find the correct ID. 
  // For now we will search by name to be safe or fallback.
  
  const growthData = data.filter(d => d.id_variable === '43' || d.variable_name?.includes('Laju Pertumbuhan'));
  const pdrbData = data.filter(d => d.id_variable === '41' || d.variable_name?.includes('PDRB ADHK'));

  // Get common years
  const years = [...new Set([...growthData, ...pdrbData].map(d => d.Tahun))].sort();
  
  // Take last 5 years only
  const recentYears = years.slice(-5);

  const chartData = {
    labels: recentYears,
    datasets: [
      {
        type: 'line' as const,
        label: 'Laju Pertumbuhan (%)',
        data: recentYears.map(year => {
          const item = growthData.find(d => d.Tahun === year);
          return item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
        }),
        borderColor: '#2563eb', // Blue 600
        borderWidth: 3,
        backgroundColor: '#fff',
        pointBorderColor: '#2563eb',
        pointRadius: 5,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'PDRB ADHK (Triliun Rp)',
        data: recentYears.map(year => {
          const item = pdrbData.find(d => d.Tahun === year);
          // Assuming data is in Miliar/Juta, scaling might be needed visually
          // If raw is 3,800,000 (Miliar), we divide to make it readable if needed
          const val = item ? parseFloat(String(item.Nilai).replace(',', '.')) : 0;
          return val > 1000 ? val / 1000 : val; // Convert to Triliun if strictly needed visual
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { position: 'bottom' as const },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Pertumbuhan (%)' },
        grid: { drawOnChartArea: false },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'PDRB (Triliun Rp)' },
      },
    },
  };

  return <Chart type='bar' data={chartData} options={options} />;
}