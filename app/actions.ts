'use server';

import { updateKonfig, addKonfigRow, saveGlobalSetting } from '@/lib/googleSheets';
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

  if (status) updates.Status = status;
  if (category) updates.Kategori = category;
  if (description !== null) updates.Deskripsi = description;
  if (chartType) updates.TipeGrafik = chartType;
  if (color) updates.Warna = color;
  if (trendLogic) updates.TrendLogic = trendLogic;
  updates.ShowOnHome = showOnHome;
  if (targetRPJMD !== null) updates.TargetRPJMD = targetRPJMD;
  if (dataFilter !== null) updates.DataFilter = dataFilter;

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
    DataFilter: formData.get('dataFilter') || ''
  };

  await addKonfigRow(newData);

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

// --- SYNC ACTIONS (Placeholders) ---
export async function initSync() { return { success: true, queue: [] }; }
export async function processSyncItem(id: string) { return { success: true }; }
export async function finishSync() { revalidatePath('/dashboard/[slug]', 'page'); }