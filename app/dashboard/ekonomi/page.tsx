import { getDashboardData } from '@/lib/googleSheets';
import EconomyDashboard from '@/components/EconomyDashboard';

export const revalidate = 3600;

export default async function EconomyPage() {
  // Fetch 'ekonomi' category data from Google Sheets
  // This expects the rows in Sheet to be labeled with 'Kategori: ekonomi'
  const { data } = await getDashboardData('ekonomi');

  return (
    <main>
      {/* We pass the raw data to the client component which handles state/filtering */}
      <EconomyDashboard data={data} />
    </main>
  );
}