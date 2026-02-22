'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export default function HomeChart({ data, color }: { data: any[], color?: string }) {
  if (!data || data.length === 0) return null;

  // Safely parse Indonesian numbers (e.g. "13,64" -> 13.64) for accurate charting
  const parseNum = (val: any) => {
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/,/g, '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const labels = data.map(d => d.Tahun);
  const values = data.map(d => parseNum(d.Nilai));

  // Default to a rich blue color, fallback to rose if desired
  const isRed = color === 'rose' || color === 'red';
  const borderColor = isRed ? 'rgba(225, 29, 72, 1)' : 'rgba(37, 99, 235, 1)'; 
  const bgColor = isRed ? 'rgba(225, 29, 72, 0.1)' : 'rgba(37, 99, 235, 0.1)';

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: borderColor,
        backgroundColor: bgColor,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3, // smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return ` ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#94a3b8' 
        }
      },
      y: {
        display: false,
        beginAtZero: false, // Ensures the graph zooms in on the variance to show trends!
      },
    },
  };

  return <Line data={chartData} options={options} />;
}