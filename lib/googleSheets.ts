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

// --- SETTINGS ---
export const getGlobalSettings = async () => {
  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Settings'];
    if (!sheet) {
        try {
            sheet = await doc.addSheet({ title: 'Settings', headerValues: ['Key', 'Value'] });
        } catch (e) {
            console.error("Could not create Settings sheet", e);
            return {};
        }
    }
    const rows = await sheet.getRows();
    const settings: Record<string, string> = {};
    rows.forEach(row => {
        settings[row.get('Key')] = row.get('Value');
    });
    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
};

export const saveGlobalSetting = async (key: string, value: string) => {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Settings'];
    if (!sheet) sheet = await doc.addSheet({ title: 'Settings', headerValues: ['Key', 'Value'] });
    const rows = await sheet.getRows();
    const existing = rows.find(r => r.get('Key') === key);
    if (existing) {
        existing.assign({ Value: value });
        await existing.save();
    } else {
        await sheet.addRow({ Key: key, Value: value });
    }
};

// --- METADATA ---
export const getMetadata = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Metadata']; 
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows.map(row => row.toObject());
  } catch (error) { 
    console.error("Error fetching metadata:", error);
    return []; 
  }
};

// --- VARIABLES ---

// Helper to find the correct header case-insensitively
const getHeader = (sheet: any, target: string) => {
    return sheet.headerValues.find((h: string) => h.toLowerCase().trim() === target.toLowerCase().trim()) || target;
};

export const getAllVariables = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if (!sheet) return [];
    const rows = await sheet.getRows();
    
    // Resolve headers dynamically to handle "DataFilter" vs "Data Filter" etc
    const idKey = getHeader(sheet, 'Id');
    const labelKey = getHeader(sheet, 'Label');
    const catKey = getHeader(sheet, 'Kategori');
    const statusKey = getHeader(sheet, 'Status');
    const descKey = getHeader(sheet, 'Deskripsi');
    const typeKey = getHeader(sheet, 'TipeGrafik');
    const colorKey = getHeader(sheet, 'Warna');
    const trendKey = getHeader(sheet, 'TrendLogic');
    const homeKey = getHeader(sheet, 'ShowOnHome');
    const targetKey = getHeader(sheet, 'TargetRPJMD');
    const filterKey = getHeader(sheet, 'DataFilter');

    return rows.map(row => ({
      Id: row.get(idKey),
      Label: row.get(labelKey),
      Kategori: row.get(catKey) || 'Uncategorized',
      Status: row.get(statusKey) || 'Non-Aktif',
      Deskripsi: row.get(descKey) || '',
      TipeGrafik: row.get(typeKey) || 'line',
      Warna: row.get(colorKey) || 'blue',
      TrendLogic: row.get(trendKey) || 'UpIsGood',
      ShowOnHome: row.get(homeKey) === 'TRUE',
      TargetRPJMD: row.get(targetKey) || '',
      DataFilter: row.get(filterKey) || '' 
    }));
  } catch (error) { 
    console.error("Error fetching variables:", error);
    return []; 
  }
};

// Helper to safely get value from row regardless of casing (for Data sheet)
const getRowValue = (row: any, keys: string[]) => {
    for (const key of keys) {
        if (row[key] !== undefined) return row[key];
    }
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
        if (foundKey) return row[foundKey];
    }
    return undefined;
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

    const idKey = getHeader(konfigSheet, 'Id');
    const catKey = getHeader(konfigSheet, 'Kategori');
    const statusKey = getHeader(konfigSheet, 'Status');
    const labelKey = getHeader(konfigSheet, 'Label');
    const descKey = getHeader(konfigSheet, 'Deskripsi');
    const typeKey = getHeader(konfigSheet, 'TipeGrafik');
    const colorKey = getHeader(konfigSheet, 'Warna');
    const trendKey = getHeader(konfigSheet, 'TrendLogic');
    const targetKey = getHeader(konfigSheet, 'TargetRPJMD');
    const filterKey = getHeader(konfigSheet, 'DataFilter');

    const activeConfig = konfigRows.filter(row => {
      const rawCat = row.get(catKey);
      const category = rawCat ? String(rawCat).toLowerCase().trim() : '';
      const status = row.get(statusKey);
      return category === slug.toLowerCase() && status === 'Aktif';
    });

    const activeIds = new Set(activeConfig.map(row => row.get(idKey)));
    const rawData = dataRows.map(row => row.toObject());
    
    const associatedData = rawData.filter(row => {
        const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
        return activeIds.has(id);
    });

    const finalData = associatedData.filter(row => {
        const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
        const config = activeConfig.find(c => c.get(idKey) === id);
        const filterStr = config?.get(filterKey);
        
        if (filterStr && String(filterStr).trim() !== '') {
            const rowCat = getRowValue(row, ['kategori', 'Kategori', 'category', 'Category', 'lapangan_usaha', 'sub_kategori']);
            const catStr = rowCat ? String(rowCat).trim().toLowerCase() : '';
            return catStr === String(filterStr).trim().toLowerCase();
        }
        return true;
    }).map(row => {
      const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
      const config = activeConfig.find(c => c.get(idKey) === id);
      return { 
          ...row, 
          id_variable: id,
          Tahun: getRowValue(row, ['Tahun', 'tahun', 'Year', 'year']),
          Nilai: getRowValue(row, ['Nilai', 'nilai', 'Value', 'value']),
          Satuan: getRowValue(row, ['Satuan', 'satuan', 'Unit', 'unit']),
          variable_name: config?.get(labelKey) || id 
      };
    });

    const metaData = activeConfig.map(r => ({
        Id: r.get(idKey),
        Label: r.get(labelKey),
        Kategori: r.get(catKey),
        Status: r.get(statusKey),
        Deskripsi: r.get(descKey) || '',
        TipeGrafik: r.get(typeKey) || 'line',
        Warna: r.get(colorKey) || 'blue',
        TrendLogic: r.get(trendKey) || 'UpIsGood',
        TargetRPJMD: r.get(targetKey) || '',
        DataFilter: r.get(filterKey) || ''
    }));

    return { meta: metaData, data: finalData };
  } catch (error) { return { meta: [], data: [] }; }
};

export const getHomeData = async () => {
  try {
    const doc = await getDoc();
    const konfigSheet = doc.sheetsByTitle['Konfig'];
    const dataSheet = doc.sheetsByTitle['Data'];
    if (!konfigSheet || !dataSheet) return { meta: [], data: [] };

    const [konfigRows, dataRows] = await Promise.all([
      konfigSheet.getRows(),
      dataSheet.getRows()
    ]);

    const idKey = getHeader(konfigSheet, 'Id');
    const homeKey = getHeader(konfigSheet, 'ShowOnHome');
    const statusKey = getHeader(konfigSheet, 'Status');
    const filterKey = getHeader(konfigSheet, 'DataFilter');
    // ... define other keys ...
    const labelKey = getHeader(konfigSheet, 'Label');
    const catKey = getHeader(konfigSheet, 'Kategori');
    const descKey = getHeader(konfigSheet, 'Deskripsi');
    const typeKey = getHeader(konfigSheet, 'TipeGrafik');
    const colorKey = getHeader(konfigSheet, 'Warna');
    const trendKey = getHeader(konfigSheet, 'TrendLogic');
    const targetKey = getHeader(konfigSheet, 'TargetRPJMD');

    const homeConfig = konfigRows.filter(row => {
      return row.get(homeKey) === 'TRUE' && row.get(statusKey) === 'Aktif';
    });

    const activeIds = new Set(homeConfig.map(row => row.get(idKey)));
    const rawData = dataRows.map(row => row.toObject());
    
    const associatedData = rawData.filter(row => {
        const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
        return activeIds.has(id);
    });

    const finalData = associatedData.filter(row => {
        const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
        const config = homeConfig.find(c => c.get(idKey) === id);
        const filterStr = config?.get(filterKey);
        
        if (filterStr && String(filterStr).trim() !== '') {
            const rowCat = getRowValue(row, ['kategori', 'Kategori', 'category', 'Category', 'lapangan_usaha', 'sub_kategori']);
            const catStr = rowCat ? String(rowCat).trim().toLowerCase() : '';
            return catStr === String(filterStr).trim().toLowerCase();
        }
        return true;
    }).map(row => {
      const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
      const config = homeConfig.find(c => c.get(idKey) === id);
      return { 
          ...row, 
          id_variable: id,
          Tahun: getRowValue(row, ['Tahun', 'tahun', 'Year', 'year']),
          Nilai: getRowValue(row, ['Nilai', 'nilai', 'Value', 'value']),
          Satuan: getRowValue(row, ['Satuan', 'satuan', 'Unit', 'unit']),
          variable_name: config?.get(labelKey) || id 
      };
    });

    const metaData = homeConfig.map(r => ({
        Id: r.get(idKey),
        Label: r.get(labelKey),
        Kategori: r.get(catKey),
        Status: r.get(statusKey),
        Deskripsi: r.get(descKey) || '',
        TipeGrafik: r.get(typeKey) || 'line',
        Warna: r.get(colorKey) || 'blue',
        TrendLogic: r.get(trendKey) || 'UpIsGood',
        TargetRPJMD: r.get(targetKey) || '',
        DataFilter: r.get(filterKey) || ''
    }));

    return { meta: metaData, data: finalData };
  } catch (error) { 
      console.error("Error getting home data", error);
      return { meta: [], data: [] }; 
  }
};

export const getNavLinks = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if(!sheet) return [];
    const rows = await sheet.getRows();
    const catKey = getHeader(sheet, 'Kategori');
    const statusKey = getHeader(sheet, 'Status');
    const categories = new Set<string>();
    rows.forEach(row => {
      const cat = row.get(catKey);
      if (cat && row.get(statusKey) === 'Aktif') {
        categories.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
      }
    });
    return Array.from(categories).sort();
  } catch (error) { return []; }
};

// --- WRITE FUNCTIONS ---

export const updateKonfig = async (id: string, updates: any) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle['Konfig'];
  const rows = await sheet.getRows();
  
  // Resolve headers
  const idKey = getHeader(sheet, 'Id');
  const statusKey = getHeader(sheet, 'Status');
  const catKey = getHeader(sheet, 'Kategori');
  const descKey = getHeader(sheet, 'Deskripsi');
  const typeKey = getHeader(sheet, 'TipeGrafik');
  const colorKey = getHeader(sheet, 'Warna');
  const trendKey = getHeader(sheet, 'TrendLogic');
  const homeKey = getHeader(sheet, 'ShowOnHome');
  const targetKey = getHeader(sheet, 'TargetRPJMD');
  const filterKey = getHeader(sheet, 'DataFilter');

  const row = rows.find(r => r.get(idKey) === id);
  
  if (row) {
    // Map internal keys to dynamic header keys
    const newValues: any = {};
    if (updates.Status !== undefined) newValues[statusKey] = updates.Status;
    if (updates.Kategori !== undefined) newValues[catKey] = updates.Kategori;
    if (updates.Deskripsi !== undefined) newValues[descKey] = updates.Deskripsi;
    if (updates.TipeGrafik !== undefined) newValues[typeKey] = updates.TipeGrafik;
    if (updates.Warna !== undefined) newValues[colorKey] = updates.Warna;
    if (updates.TrendLogic !== undefined) newValues[trendKey] = updates.TrendLogic;
    if (updates.ShowOnHome !== undefined) newValues[homeKey] = updates.ShowOnHome;
    if (updates.TargetRPJMD !== undefined) newValues[targetKey] = updates.TargetRPJMD;
    if (updates.DataFilter !== undefined) newValues[filterKey] = updates.DataFilter;
    
    if (Object.keys(newValues).length > 0) {
        row.assign(newValues);
        await row.save();
    }
  }
};

export const addKonfigRow = async (newData: any) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if (sheet) {
        // Map keys to dynamic headers
        const rowData: any = {};
        rowData[getHeader(sheet, 'Id')] = newData.Id;
        rowData[getHeader(sheet, 'Label')] = newData.Label;
        rowData[getHeader(sheet, 'Kategori')] = newData.Kategori;
        rowData[getHeader(sheet, 'Status')] = newData.Status;
        rowData[getHeader(sheet, 'Deskripsi')] = newData.Deskripsi;
        rowData[getHeader(sheet, 'TipeGrafik')] = newData.TipeGrafik;
        rowData[getHeader(sheet, 'Warna')] = newData.Warna;
        rowData[getHeader(sheet, 'TrendLogic')] = newData.TrendLogic;
        rowData[getHeader(sheet, 'ShowOnHome')] = newData.ShowOnHome;
        rowData[getHeader(sheet, 'TargetRPJMD')] = newData.TargetRPJMD;
        rowData[getHeader(sheet, 'DataFilter')] = newData.DataFilter;

        await sheet.addRow(rowData);
    }
};