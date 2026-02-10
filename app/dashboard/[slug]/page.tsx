import { getDashboardData } from '@/lib/googleSheets';
import GenericDashboard from '@/components/GenericDashboard';
import DataTable from '@/components/DataTable';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export default async function DynamicDashboard(props: PageProps) {
  const params = await props.params;
  const { slug } = params;

  const { meta, data } = await getDashboardData(slug);
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const sortedHeaders = headers.sort((a, b) => {
    if (a === 'Tahun') return -1;
    if (b === 'Tahun') return 1;
    if (a === 'Nilai') return -1;
    if (b === 'Nilai') return 1;
    return 0;
  });

  if (meta.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-lg shadow-sm">
          <h1 className="text-3xl font-bold mb-4 text-slate-900">{title} Dashboard</h1>
          <p className="text-slate-600">No active indicators found for this category.</p>
          <p className="text-slate-500 mt-4 text-sm">
            Go to
            <span className="text-indigo-700 font-mono bg-indigo-50 px-2 py-1 rounded mx-1">/admin</span>
            to assign variables to
            <span className="text-indigo-700 font-mono bg-indigo-50 px-2 py-1 rounded mx-1">&quot;{slug}&quot;</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <GenericDashboard data={data} meta={meta} category={title} />

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Detailed Data</h3>
            <span className="text-xs text-slate-500 uppercase tracking-wide">{data.length} Records</span>
          </div>
          <div className="p-2">
            <DataTable data={data} headers={sortedHeaders} />
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-slate-200 bg-slate-50 text-center">
        <p className="text-xs text-slate-400">© 2025 BPS Kabupaten Majene. Sumber Data: BPS Web API.</p>
      </footer>
    </main>
  );
}
