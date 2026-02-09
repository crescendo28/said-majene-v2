import { getDashboardData } from '@/lib/googleSheets';
import PovertyDashboard from '@/components/PovertyDashboard';

export const revalidate = 3600;

export default async function PovertyPage() {
  // We fetch 'kemiskinan' data. 
  // IMPORTANT: If this returns null, the component below now handles it safely.
  const { data } = await getDashboardData('kemiskinan');

  return (
    <main>
      <PovertyDashboard data={data} />
    </main>
  );
}