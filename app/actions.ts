'use server';

import { updateKonfig, addKonfigRow, saveGlobalSetting, replaceDataForVariable, saveAnalysisConfig, deleteAnalysisConfig } from '@/lib/googleSheets';
import { fetchVariableData } from '@/lib/bps';
import { revalidatePath } from 'next/cache';

// --- CONFIG ACTIONS ---

export async function saveConfig(formData: FormData) {
  const id = formData.get('id') as string;
  const updates: any = {};
  
  const status = formData.get('status') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const chartType = formData.get('chartType') as string;
  const color = formData.get('color') as string;
  const trendLogic = formData.get('trendLogic') as string;
  const showOnHome = formData.get('showOnHome') === 'on' ? 'TRUE' : 'FALSE';
  const targetRPJMD = formData.get('targetRPJMD') as string;
  const dataFilter = formData.get('dataFilter') as string;
  const filterTahun = formData.get('filterTahun') as string;

  if (status) updates.Status = status;
  if (category) updates.Kategori = category;
  if (description !== null) updates.Deskripsi = description;
  if (chartType) updates.TipeGrafik = chartType;
  if (color) updates.Warna = color;
  if (trendLogic) updates.TrendLogic = trendLogic;
  updates.ShowOnHome = showOnHome;
  if (targetRPJMD !== null) updates.TargetRPJMD = targetRPJMD;
  if (dataFilter !== null) updates.DataFilter = dataFilter;
  if (filterTahun !== null) updates.FilterTahun = filterTahun;

  await updateKonfig(id, updates);
  
  revalidatePath('/admin');
  revalidatePath('/dashboard/[slug]', 'page');
  revalidatePath('/'); 
}

export async function createIndicator(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const label = formData.get('label') as string;
  const category = formData.get('category') as string;
  
  if (!id || !label || !category) {
    return { error: "ID, Label, and Category are required" };
  }

  const newData = {
    Id: id,
    Label: label,
    Kategori: category,
    Status: formData.get('status') || 'Aktif',
    Deskripsi: formData.get('description') || '',
    TipeGrafik: formData.get('chartType') || 'line',
    Warna: formData.get('color') || 'blue',
    TrendLogic: formData.get('trendLogic') || 'UpIsGood',
    ShowOnHome: 'FALSE',
    TargetRPJMD: '',
    DataFilter: formData.get('dataFilter') || '',
    FilterTahun: formData.get('filterTahun') || ''
  };

  await addKonfigRow(newData);

  try {
      await processSyncItem(id);
  } catch (e) {
      console.error("Auto-sync failed for new variable:", e);
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard/[slug]', 'page');
  revalidatePath('/');
  
  return { success: true };
}

export async function updateSettings(formData: FormData) {
    const pubLink = formData.get('publicationLink') as string;
    if (pubLink !== null) {
        await saveGlobalSetting('publication_link', pubLink);
    }
    revalidatePath('/');
    revalidatePath('/admin');
}

// --- SYNC ACTIONS ---

export async function initSync() { 
    return { success: true, queue: [] }; 
}

export async function processSyncItem(id: string) {
    try {
        console.log(`Starting sync for variable ${id}...`);
        const data = await fetchVariableData(id);
        if (!data || data.length === 0) {
            console.warn(`No data found for variable ${id} from BPS.`);
            return { success: false, error: "No data found from BPS API. Check Variable ID." };
        }
        await replaceDataForVariable(id, data);
        console.log(`Sync successful for ${id}. Rows: ${data.length}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Sync failed for ${id}:`, error);
        return { success: false, error: error.message };
    }
}

export async function finishSync() { 
    revalidatePath('/dashboard/[slug]', 'page'); 
    revalidatePath('/');
}

// === ANALYSIS ACTIONS ===

export async function saveAnalysisAction(formData: FormData) {
    const data = {
        Id: formData.get('id') as string,
        Title: formData.get('title') as string,
        Category: formData.get('category') as string,
        Description: formData.get('description') as string,
        ChartType: formData.get('chartType') as string,
        SheetName: formData.get('sheetName') as string,
        XAxisCol: formData.get('xAxis') as string,
        YAxisCol: formData.get('yAxis') as string,
        Status: formData.get('status') as string,
        TooltipCol: formData.get('tooltipCol') as string, // Handle new field
    };

    await saveAnalysisConfig(data);
    revalidatePath('/analysis');
    revalidatePath('/admin/analysis');
}

export async function deleteAnalysisAction(id: string) {
    await deleteAnalysisConfig(id);
    revalidatePath('/analysis');
    revalidatePath('/admin/analysis');
}