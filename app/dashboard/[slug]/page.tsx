import { getDashboardData } from '@/lib/googleSheets';
import GenericDashboard from '@/components/GenericDashboard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export default async function Page(props: PageProps) {
  const params = await props.params;
  const { slug } = params;
  
  // Fetch data - getDashboardData handles decoding internally now too
  const { meta, data } = await getDashboardData(slug);
  
  // Clean up title for display
  const title = decodeURIComponent(slug).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (meta.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-lg shadow-sm">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">{title} Dashboard</h1>
          <p className="text-slate-500">Belum ada indikator aktif untuk kategori ini.</p>
          <p className="text-slate-500 mt-4 text-sm">
            Silakan login ke 
            <span className="text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded mx-1">/admin</span> 
            untuk menambahkan indikator baru ke kategori 
            <span className="text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded mx-1">"{decodeURIComponent(slug)}"</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GenericDashboard 
      category={title} 
      data={data} 
      meta={meta} 
    />
  );
}