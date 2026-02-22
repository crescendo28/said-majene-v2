'use client';

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
} from 'chart.js';
import { Line, Bar, Doughnut, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
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
);

// Helper function to safely parse numbers, converting Indonesian comma decimals (1,81) to dots (1.81)
const parseNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Replace comma with dot and parse
  const parsed = parseFloat(String(val).replace(/,/g, '.'));
  return isNaN(parsed) ? 0 : parsed;
};

export default function AnalysisChart({ data, config }: { data: any[], config: any }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-75 text-slate-400 font-medium">
        Data belum tersedia / kosong di Spreadsheet.
      </div>
    );
  }

  // Identify columns to use
  const isScatter = config.ChartType === 'scatter';
  const xCol = config.XAxisCol || Object.keys(data[0])[0];
  const yCol = config.YAxisCol || Object.keys(data[0])[1];
  
  // Assume the first column is the label/name of the item (e.g., "A. Pertanian...")
  const labelCol = Object.keys(data[0])[0]; 

  let chartData: any;

  if (isScatter) {
    // Scatter charts require data in {x, y} format
    chartData = {
      datasets: [
        {
          label: config.Title || 'Data',
          data: data.map((row) => ({
            x: parseNumber(row[xCol]),
            y: parseNumber(row[yCol]),
            itemName: row[labelCol] || 'Unknown', // Store original name for the tooltip
          })),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(29, 78, 216, 1)',
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 1,
        },
      ],
    };
  } else {
    // Line, Bar, Pie, Doughnut use standard array format
    chartData = {
      labels: data.map((row) => row[xCol] || 'N/A'),
      datasets: [
        {
          label: config.Title || yCol,
          data: data.map((row) => parseNumber(row[yCol])),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgba(29, 78, 216, 1)',
            'rgba(4, 120, 87, 1)',
            'rgba(180, 83, 9, 1)',
            'rgba(185, 28, 28, 1)',
            'rgba(109, 40, 217, 1)',
          ],
          borderWidth: 1,
          fill: config.ChartType === 'line',
          tension: 0.4, // Smooth curves for lines
        },
      ],
    };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: ['pie', 'doughnut'].includes(config.ChartType), // Only show legend for Pie/Doughnut
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            if (isScatter) {
              const point = context.raw;
              return `${point.itemName}: (${point.x}, ${point.y})`;
            } else {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y;
              }
              return label;
            }
          },
        },
      },
    },
    scales: ['pie', 'doughnut'].includes(config.ChartType) 
      ? undefined 
      : {
          x: isScatter 
            ? { 
                type: 'linear', 
                position: 'bottom',
                title: { display: true, text: xCol, font: { weight: 'bold' } },
                grid: {
                  // Make the X=0 line bold and dark, rest are light
                  color: (context: any) => context.tick?.value === 0 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(226, 232, 240, 1)',
                  lineWidth: (context: any) => context.tick?.value === 0 ? 3 : 1,
                }
              } 
            : undefined, // Normal charts use CategoryScale
          y: { 
            beginAtZero: false,
            title: { display: isScatter, text: yCol, font: { weight: 'bold' } },
            grid: isScatter ? {
              // Make the Y=0 line bold and dark, rest are light
              color: (context: any) => context.tick?.value === 0 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(226, 232, 240, 1)',
              lineWidth: (context: any) => context.tick?.value === 0 ? 3 : 1,
            } : undefined,
          },
        },
  };

  const ChartComponent =
    config.ChartType === 'bar' ? Bar :
    config.ChartType === 'doughnut' ? Doughnut :
    config.ChartType === 'pie' ? Pie :
    config.ChartType === 'scatter' ? Scatter : Line;

  return (
    <div className="w-full h-full min-h-100">
      <ChartComponent data={chartData} options={options as any} />
    </div>
  );
}