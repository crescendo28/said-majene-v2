import { getAnalysisConfig } from '@/lib/googleSheets';
import AnalysisAdminPanel from '@/components/AnalysisAdminPanel';

export const revalidate = 0;

export default async function AnalysisAdminPage() {
  const configs = await getAnalysisConfig();

  return (
    <AnalysisAdminPanel configs={configs} />
  );
}