import { getAllVariables, getGlobalSettings, getMetadata } from '@/lib/googleSheets';
import AdminPanel from '@/components/AdminPanel';

export const revalidate = 0; // Always dynamic for admin panel

export default async function AdminPage() {
  // Fetch config data from Google Sheets
  const variables = await getAllVariables();
  const settings = await getGlobalSettings();
  
  // Fetch metadata from 'Metadata' sheet
  const metadata = await getMetadata();

  return (
    <div className="min-h-screen bg-slate-100">
        <AdminPanel 
            konfigData={variables || []} 
            metadata={metadata || []} 
            settings={settings}
        />
    </div>
  );
}