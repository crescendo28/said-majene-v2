'use server';

import { updateKonfig, addKonfigRow, clearDataSheet, appendDataRows, getSheetData } from '@/lib/googleSheets';
import { fetchVariableData } from '@/lib/bps';
import { revalidatePath } from 'next/cache';

// Config Actions
export async function saveConfig(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const category = formData.get('category') as string;
  await updateKonfig(id, status, category);
  revalidatePath('/admin');
}

export async function createIndicator(prevState: any, formData: FormData) {
    const id = formData.get('id') as string;
    const label = formData.get('label') as string;
    const category = formData.get('category') as string;
    
    if (!id || !label) return { message: 'Failed' };

    await addKonfigRow({
        Tipe: 'Variabel',
        Id: id,
        Label: label,
        Status: 'Aktif',
        Kategori: category
    });
    revalidatePath('/admin');
    return { message: 'Success' };
}

// --- NODE.JS SYNC WORKFLOW ---

// Step 1: Prepare (Get Active Vars & Clear Sheet)
export async function initSync() {
    try {
        const konfig = await getSheetData('Konfig');
        const activeVariables = konfig
            .filter((r: any) => r.Status === 'Aktif' && r.Tipe === 'Variabel')
            .map((r: any) => ({ id: r.Id, label: r.Label }));

        // Critical: Clear the Data sheet before writing new data
        await clearDataSheet();

        return { success: true, queue: activeVariables };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Init Failed' };
    }
}

// Step 2: Process One Variable
export async function processSyncItem(varId: string) {
    try {
        // Fetch from BPS via Node.js
        const rows = await fetchVariableData(varId);
        
        // Write to Google Sheet
        if (rows.length > 0) {
            await appendDataRows(rows);
        }

        return { success: true, count: rows.length };
    } catch (error) {
        console.error(`Failed to sync var ${varId}`, error);
        return { success: false, error: 'Fetch Failed' };
    }
}

// Step 3: Finish
export async function finishSync() {
    revalidatePath('/'); 
    revalidatePath('/dashboard');
}