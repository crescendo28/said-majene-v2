import { getSheetData } from '@/lib/googleSheets';
import AdminPanel from '@/components/AdminPanel';

export const revalidate = 0; // Ensure admin always sees fresh data

export default async function AdminPage() {
  // Fetch Config (Existing active indicators)
  const konfigData = await getSheetData('Konfig');
  
  // Fetch Metadata (Available indicators from API/Source)
  const metadata = await getSheetData('Metadata');

  return (
    <main>
        <AdminPanel konfigData={konfigData} metadata={metadata} />
    </main>
  );
}