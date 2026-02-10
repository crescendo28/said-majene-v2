import { getAllVariables } from '@/lib/googleSheets';
import AdminPanel from '@/components/AdminPanel';

export const revalidate = 0; // Always dynamic for admin panel

export default async function AdminPage() {
  // Fetch config data from Google Sheets
  const variables = await getAllVariables();
  
  // In a real scenario, you might fetch metadata from BPS here.
  // For now, we pass an empty array to prevent errors.
  const metadata: any[] = []; 

  return (
    <div className="min-h-screen bg-slate-100">
        <AdminPanel konfigData={variables || []} metadata={metadata} />
    </div>
  );
}