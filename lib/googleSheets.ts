// ... (Imports & Auth same as before) ...
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const auth = new JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getDoc() {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID is missing");
  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
}

export const getSheetData = async (sheetName: string) => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
  } catch (error) { return []; }
};

export const getDashboardData = async (slug: string) => {
  try {
    const doc = await getDoc();
    const konfigSheet = doc.sheetsByTitle['Konfig'];
    const dataSheet = doc.sheetsByTitle['Data'];
    if (!konfigSheet || !dataSheet) return { meta: [], data: [] };

    const [konfigRows, dataRows] = await Promise.all([
      konfigSheet.getRows(),
      dataSheet.getRows()
    ]);

    const activeConfig = konfigRows.filter(row => {
      const rawCat = row.get('Kategori');
      const category = rawCat ? String(rawCat).toLowerCase().trim() : '';
      const status = row.get('Status');
      return category === slug.toLowerCase() && status === 'Aktif';
    });

    const activeIds = new Set(activeConfig.map(row => row.get('Id')));
    const rawData = dataRows.map(row => row.toObject());
    const filteredData = rawData.filter(row => activeIds.has(row.id_variable));

    const finalData = filteredData.map(row => {
      const config = activeConfig.find(c => c.get('Id') === row.id_variable);
      return { ...row, variable_name: config?.get('Label') || row.id_variable };
    });

    const metaData = activeConfig.map(r => ({
        Id: r.get('Id'),
        Label: r.get('Label'),
        Kategori: r.get('Kategori'),
        Status: r.get('Status'),
        Deskripsi: r.get('Deskripsi') || '',
        TipeGrafik: r.get('TipeGrafik') || 'line',
        Warna: r.get('Warna') || 'blue',
        TrendLogic: r.get('TrendLogic') || 'UpIsGood'
    }));

    return { meta: metaData, data: finalData };
  } catch (error) { return { meta: [], data: [] }; }
};

export const getNavLinks = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if(!sheet) return [];
    const rows = await sheet.getRows();
    const categories = new Set<string>();
    rows.forEach(row => {
      const cat = row.get('Kategori');
      if (cat && row.get('Status') === 'Aktif') categories.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
    });
    return Array.from(categories).sort();
  } catch (error) { return []; }
};

// --- WRITE FUNCTIONS ---

export const updateKonfig = async (id: string, newStatus: string, newCategory: string, newDesc?: string, newChartType?: string, newColor?: string, newTrend?: string) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle['Konfig'];
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('Id') === id);
  if (row) {
    const updates: any = { Status: newStatus, Kategori: newCategory };
    if (newDesc !== undefined) updates.Deskripsi = newDesc;
    if (newChartType !== undefined) updates.TipeGrafik = newChartType;
    if (newColor !== undefined) updates.Warna = newColor;
    if (newTrend !== undefined) updates.TrendLogic = newTrend;
    
    row.assign(updates);
    await row.save();
  }
};

export const addKonfigRow = async (newData: any) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    await sheet.addRow(newData);
};

export const clearDataSheet = async () => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Data'];
    if (sheet) {
        const rows = await sheet.getRows();
        if(rows.length > 0) {
            await sheet.clear(); 
            await sheet.setHeaderRow(['id_domain', 'kategori', 'Tahun', 'Periode', 'Pilih Tahun', 'id_variable', 'Nama Variabel', 'Nilai', 'Satuan']);
        }
    }
};

export const appendDataRows = async (rows: any[]) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Data'];
    if (sheet && rows.length > 0) await sheet.addRows(rows);
};