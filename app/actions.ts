'use server';

import { updateKonfig, addKonfigRow, clearDataSheet, appendDataRows, getSheetData } from '@/lib/googleSheets';
import { fetchVariableData } from '@/lib/bps';
import { revalidatePath } from 'next/cache';

// Config Actions
export async function saveConfig(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string || 'Aktif'; 
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const chartType = formData.get('chartType') as string;
  const color = formData.get('color') as string;
  const trendLogic = formData.get('trendLogic') as string;

  await updateKonfig(id, status, category, description, chartType, color, trendLogic);
  revalidatePath('/admin');
}

export async function createIndicator(prevState: any, formData: FormData) {
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const chartType = formData.get('chartType') as string;
    const color = formData.get('color') as string;
    const trendLogic = formData.get('trendLogic') as string;
    
    if (!id || !label) return { message: 'Failed' };

    await addKonfigRow({
        Tipe: 'Variabel',
        Id: id,
        Label: label,
        Status: 'Aktif',
        Kategori: category,
        Deskripsi: description,
        TipeGrafik: chartType || 'line',
        Warna: color || 'blue',
        TrendLogic: trendLogic || 'UpIsGood'
    });
    revalidatePath('/admin');
    return { message: 'Success' };
}

// ... (Rest of sync logic remains same) ...
export async function initSync() { try { const konfig = await getSheetData('Konfig'); const activeVariables = konfig.filter((r: any) => r.Status === 'Aktif' && r.Tipe === 'Variabel').map((r: any) => ({ id: r.Id, label: r.Label })); await clearDataSheet(); return { success: true, queue: activeVariables }; } catch (e) { console.error(e); return { success: false, error: 'Init Failed' }; } }
export async function processSyncItem(varId: string) { try { const rows = await fetchVariableData(varId); if (rows.length > 0) { await appendDataRows(rows); } return { success: true, count: rows.length }; } catch (error) { console.error(`Failed to sync var ${varId}`, error); return { success: false, error: 'Fetch Failed' }; } }
export async function finishSync() { revalidatePath('/'); revalidatePath('/dashboard'); }