import { getDashboardData } from '@/lib/googleSheets';
import TrendChart from '@/components/TrendChart';
import DataTable from '@/components/DataTable';

// FIX: Update Props type for Next.js 15
interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export default async function DynamicDashboard(props: PageProps) {
  // FIX: Await params before using them
  const params = await props.params;
  const { slug } = params;
  
  const { meta, data } = await getDashboardData(slug);
  
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Sort headers: Put Tahun and Nilai first if they exist
  const sortedHeaders = headers.sort((a, b) => {
    if (a === 'Tahun') return -1;
    if (b === 'Tahun') return 1;
    if (a === 'Nilai') return -1;
    if (b === 'Nilai') return 1;
    return 0;
  });

  if (meta.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-lg">
          <h1 className="text-3xl font-bold mb-4 text-slate-200">{title} Dashboard</h1>
          <p className="text-slate-400">No active indicators found for this category.</p>
          <p className="text-slate-500 mt-4 text-sm">
            Go to 
            <span className="text-emerald-400 font-mono bg-slate-950 px-2 py-1 rounded mx-1">/admin</span> 
            to assign variables to 
            <span className="text-emerald-400 font-mono bg-slate-950 px-2 py-1 rounded mx-1">"{slug}"</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400 tracking-tight">
              {title} Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Monitoring {meta.length} key indicators
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Data
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart - Takes up 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-1">
                <TrendChart data={data} />
            </div>
          </div>

          {/* Side Panel / Summary - Takes up 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Records</p>
                  <p className="text-2xl font-bold text-white">{data.length}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Indicators</p>
                  <p className="text-2xl font-bold text-emerald-400">{meta.length}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Data Table Section - Full Width */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-emerald-100">Detailed Data</h3>
            </div>
            <div className="p-2">
              <DataTable data={data} headers={sortedHeaders} />
            </div>
        </div>

      </div>
    </main>
  );
}