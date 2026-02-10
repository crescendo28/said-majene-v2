'use server';

import { updateKonfig, addKonfigRow } from '@/lib/googleSheets';
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

  // Only add if they exist to avoid overwriting with nulls
  if (status) updates.Status = status;
  if (category) updates.Kategori = category;
  if (description !== null) updates.Deskripsi = description;
  if (chartType) updates.TipeGrafik = chartType;
  if (color) updates.Warna = color;
  if (trendLogic) updates.TrendLogic = trendLogic;

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
    TrendLogic: formData.get('trendLogic') || 'UpIsGood'
  };

  await addKonfigRow(newData);

  revalidatePath('/admin');
  revalidatePath('/dashboard/[slug]', 'page');
  revalidatePath('/');
  
  return { success: true };
}

// --- SYNC ACTIONS (Placeholders to prevent build errors) ---
// Since we don't have the full BPS sync logic in this context, 
// these placeholders ensure your UI doesn't crash.

export async function initSync() {
  // In a real app, this would fetch the list of IDs to sync from BPS API
  return { success: true, queue: [] };
}

export async function processSyncItem(id: string) {
  // In a real app, this would fetch data for a single ID and update the 'Data' sheet
  return { success: true };
}

export async function finishSync() {
  revalidatePath('/dashboard/[slug]', 'page');
}