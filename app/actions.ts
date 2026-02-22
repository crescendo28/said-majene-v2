'use server';

import {
  updateKonfig,
  addKonfigRow,
  deleteKonfigRow, 
  saveGlobalSetting,
  replaceDataForVariable,
  saveAnalysisConfig,
  deleteAnalysisConfig,
  getAllVariables,
} from '@/lib/googleSheets';

import { fetchVariableData } from '@/lib/bps';
import { revalidatePath } from 'next/cache';

// ======================
// Helper Utils
// ======================
function getString(formData: FormData, key: string, fallback = ''): string {
  const val = formData.get(key);
  if (typeof val === 'string') return val.trim();
  return fallback;
}

function getBooleanAsSheetValue(formData: FormData, key: string): 'TRUE' | 'FALSE' {
  const val = formData.get(key);
  return val === 'on' ? 'TRUE' : 'FALSE';
}

// ======================
// CONFIG ACTIONS
// ======================
export async function saveConfig(formData: FormData) {
  const id = getString(formData, 'id');

  if (!id) {
    return { success: false, error: 'Missing indicator ID.' };
  }

  const updates: Record<string, string> = {};

  const status = getString(formData, 'status');
  const category = getString(formData, 'category');
  const description = getString(formData, 'description');
  const chartType = getString(formData, 'chartType');
  const color = getString(formData, 'color');
  const trendLogic = getString(formData, 'trendLogic');
  const showOnHome = getBooleanAsSheetValue(formData, 'showOnHome');
  const targetRPJMD = getString(formData, 'targetRPJMD');
  const dataFilter = getString(formData, 'dataFilter');
  const filterTahun = getString(formData, 'filterTahun');

  if (status) updates.Status = status;
  if (category) updates.Kategori = category;

  // always save description even if empty
  updates.Deskripsi = description;

  if (chartType) updates.TipeGrafik = chartType;
  if (color) updates.Warna = color;
  if (trendLogic) updates.TrendLogic = trendLogic;

  updates.ShowOnHome = showOnHome;

  // allow empty values to clear fields
  updates.TargetRPJMD = targetRPJMD;
  updates.DataFilter = dataFilter;
  updates.FilterTahun = filterTahun;

  await updateKonfig(id, updates);

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

export async function createIndicator(prevState: any, formData: FormData) {
  const id = getString(formData, 'id');
  const label = getString(formData, 'label');
  const category = getString(formData, 'category');

  if (!id || !label || !category) {
    return { success: false, error: 'ID, Label, and Category are required.' };
  }

  const existingVariables = await getAllVariables();
  const isDuplicate = existingVariables.some((v) => v.Id === id);
  
  if (isDuplicate) {
    return { 
      success: false, 
      error: `Gagal: Indikator dengan ID "${id}" sudah ada di database!` 
    };
  }

  const newData = {
    Id: id,
    Label: label,
    Kategori: category,
    Status: getString(formData, 'status', 'Aktif'),
    Deskripsi: getString(formData, 'description', ''),
    TipeGrafik: getString(formData, 'chartType', 'line'),
    Warna: getString(formData, 'color', 'blue'),
    TrendLogic: getString(formData, 'trendLogic', 'UpIsGood'),
    ShowOnHome: 'FALSE',
    TargetRPJMD: '',
    DataFilter: getString(formData, 'dataFilter', ''),
    FilterTahun: getString(formData, 'filterTahun', ''),
  };

  await addKonfigRow(newData);

  try {
    await processSyncItem(id);
  } catch (e) {
    console.error('Auto-sync failed for new indicator:', e);
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');

  return { success: true };
}

export async function deleteIndicatorAction(id: string) {
  if (!id) {
    return { success: false, error: 'Missing indicator ID.' };
  }

  try {
    await deleteKonfigRow(id);
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete indicator ${id}:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateSettings(formData: FormData) {
  const pubLink = getString(formData, 'publicationLink', '');
  await saveGlobalSetting('publication_link', pubLink);
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

// ======================
// SYNC ACTIONS
// ======================
export async function initSync() {
  return { success: true, queue: [] };
}

export async function processSyncItem(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'Missing variable ID.' };
    }
    const data = await fetchVariableData(id);

    if (!data || data.length === 0) {
      return { success: false, error: 'No data found from BPS API. Check Variable ID.' };
    }
    await replaceDataForVariable(id, data);
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export async function finishSync() {
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

// ======================
// ANALYSIS ACTIONS
// ======================
export async function saveAnalysisAction(formData: FormData) {
  const data = {
    Id: getString(formData, 'id'),
    Title: getString(formData, 'title'),
    Category: getString(formData, 'category'),
    Description: getString(formData, 'description'),
    ChartType: getString(formData, 'chartType'),
    SheetName: getString(formData, 'sheetName'),
    XAxisCol: getString(formData, 'xAxis'),
    YAxisCol: getString(formData, 'yAxis'),
    Status: getString(formData, 'status'),
    TooltipCol: getString(formData, 'tooltipCol'),
    Year: getString(formData, 'year'), // Added Year saving support
  };

  if (!data.Id || !data.Title || !data.SheetName) {
    return { success: false, error: 'Id, Title, and SheetName are required.' };
  }

  await saveAnalysisConfig(data);

  revalidatePath('/analysis');
  revalidatePath('/admin/analysis');
  revalidatePath(`/analysis/${data.Id}`);

  return { success: true };
}

export async function deleteAnalysisAction(id: string) {
  if (!id) {
    return { success: false, error: 'Missing analysis id.' };
  }

  await deleteAnalysisConfig(id);

  revalidatePath('/analysis');
  revalidatePath('/admin/analysis');

  return { success: true };
}