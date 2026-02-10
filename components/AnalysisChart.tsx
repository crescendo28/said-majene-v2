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
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

interface ChartSeries {
    name: string;
    key: string;
    type?: 'line' | 'bar';
    color: string;
    yAxisID?: string;
}

interface Props {
    type: string;
    data: any[];
    xCol?: string; 
    yCol?: string; 
    label?: string;
    tooltipCol?: string;
    series?: ChartSeries[];
    yAxisLabel2?: string; 
}

const getValue = (row: any, key: string) => {
    if (!key) return null;
    const exact = row[key];
    if (exact !== undefined) return exact;
    const lowerKey = key.toLowerCase().trim();
    const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey);
    return foundKey ? row[foundKey] : null;
};

// Quadrant Plugin for Scatter
const quadrantPlugin = {
  id: 'quadrants',
  beforeDraw(chart: any) {
    const { ctx, chartArea: { left, top, right, bottom }, scales: { x, y } } = chart;
    const x0 = x.getPixelForValue(0);
    const y0 = y.getPixelForValue(0);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)'; 
    ctx.setLineDash([5, 5]); 

    if (y0 >= top && y0 <= bottom) {
        ctx.beginPath();
        ctx.moveTo(left, y0);
        ctx.lineTo(right, y0);
        ctx.stroke();
    }

    if (x0 >= left && x0 <= right) {
        ctx.beginPath();
        ctx.moveTo(x0, top);
        ctx.lineTo(x0, bottom);
        ctx.stroke();
    }
    ctx.restore();
  }
};

export function AnalysisChart({ type, data, xCol, yCol, label, tooltipCol, series, yAxisLabel2 }: Props) {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-xl">Data tidak tersedia</div>;

    // --- SCATTER PLOT SPECIAL LOGIC ---
    if (type === 'scatter') {
        const scatterDataPoints = data.map((row, i) => {
            const rawX = getValue(row, xCol || 'x');
            const rawY = getValue(row, yCol || 'y');
            const x = typeof rawX === 'string' ? parseFloat(rawX.replace(',', '.')) : Number(rawX);
            const y = typeof rawY === 'string' ? parseFloat(rawY.replace(',', '.')) : Number(rawY);
            
            return {
                x,
                y,
                // Use tooltipCol if provided, otherwise fallback to label/name
                label: tooltipCol ? getValue(row, tooltipCol) : (row.label || `Point ${i + 1}`)
            };
        });

        const backgroundColors = scatterDataPoints.map((_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)`);

        const scatterData = {
            datasets: [{
                label: label || 'Scatter Data',
                data: scatterDataPoints,
                backgroundColor: backgroundColors,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        const scatterOptions: any = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: (context: any) => context.raw.label,
                        afterLabel: (context: any) => `(${context.raw.x}, ${context.raw.y})`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, title: { display: true, text: xCol || 'X', font: { size: 10, weight: 'bold' } } },
                y: { grid: { display: false }, title: { display: true, text: yCol || 'Y', font: { size: 10, weight: 'bold' } } }
            }
        };

        return <Scatter data={scatterData} options={scatterOptions} plugins={[quadrantPlugin]} />;
    }

    // --- MIXED / MULTI-LINE CHARTS ---
    if (type === 'mixed' || type === 'multi-line') {
        const labels = data.map(row => row.label || getValue(row, xCol || 'label'));
        
        const datasets = series?.map((s) => ({
            type: s.type || 'line',
            label: s.name,
            data: data.map(row => {
                const val = getValue(row, s.key);
                return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
            }),
            borderColor: s.color,
            backgroundColor: s.type === 'bar' ? s.color : undefined, // Fill color for bar
            borderWidth: 2,
            pointRadius: 4,
            yAxisID: s.yAxisID || 'y',
            order: s.type === 'bar' ? 2 : 1 // Lines on top
        })) || [];

        const mixedData = { labels, datasets };

        // Determine if we need the secondary axis
        const useSecondaryAxis = yAxisLabel2 || series?.some(s => s.yAxisID === 'y1');

        // Define scales carefully. Chart.js 3+ allows any key in 'scales'.
        const scalesConfig: any = {
            x: { 
                type: 'category', // Explicitly set category for X axis
                grid: { display: false } 
            },
            y: { 
                type: 'linear', 
                display: true, 
                position: 'left',
                grid: { color: '#f1f5f9' },
                title: { display: true, text: 'Jumlah / Nilai' }
            }
        };

        // Only add y1 if needed
        if (useSecondaryAxis) {
            scalesConfig.y1 = {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false }, // only want the grid lines for one axis to show up
                title: { display: true, text: yAxisLabel2 || '' }
            };
        }

        const mixedOptions: any = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { 
                    mode: 'index', 
                    intersect: false 
                }
            },
            scales: scalesConfig
        };

        // Use Bar component for mixed charts (it can render lines too if defined in datasets)
        return <Bar data={mixedData} options={mixedOptions} />;
    }

    // --- STANDARD SINGLE SERIES CHARTS (Fallback/Legacy) ---
    const labels = data.map(row => row.label || getValue(row, xCol || 'label'));
    const values = data.map(row => {
         const val = getValue(row, yCol || 'value');
         return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
    });

    const chartData = {
        labels,
        datasets: [{
            label: label || 'Data',
            data: values,
            borderColor: '#3b82f6',
            backgroundColor: type === 'bar' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: type === 'line'
        }]
    };
    
    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
             x: { grid: { display: false } },
             y: { grid: { color: '#f1f5f9' } }
        }
    };

    if (type === 'bar') return <Bar data={chartData} options={options} />;
    return <Line data={chartData} options={options} />;
}