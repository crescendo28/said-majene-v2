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

// --- HELPERS ---

const getHeader = (sheet: any, target: string) => {
    if (!sheet.headerValues) return target;
    return sheet.headerValues.find((h: string) => h.toLowerCase().trim() === target.toLowerCase().trim()) || target;
};

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

// --- DATA ACCESS ---

export const getSheetData = async (sheetName: string) => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return [];
    await sheet.loadHeaderRow(); 
    const rows = await sheet.getRows();
    return rows.map((row) => row.toObject());
  } catch (error) { return []; }
};

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
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const settings: Record<string, string> = {};
    rows.forEach(row => {
        settings[row.get('Key')] = row.get('Value');
    });
    return settings;
  } catch (error) {
    return {};
  }
};

export const saveGlobalSetting = async (key: string, value: string) => {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Settings'];
    if (!sheet) sheet = await doc.addSheet({ title: 'Settings', headerValues: ['Key', 'Value'] });
    
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const existing = rows.find(r => r.get('Key') === key);
    if (existing) {
        existing.assign({ Value: value });
        await existing.save();
    } else {
        await sheet.addRow({ Key: key, Value: value });
    }
};

export const getMetadata = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Metadata']; 
    if (!sheet) return [];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    return rows.map(row => row.toObject());
  } catch (error) { return []; }
};

export const getAllVariables = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if (!sheet) return [];
    
    await sheet.loadHeaderRow(); 
    const rows = await sheet.getRows();
    
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
    const yearKey = getHeader(sheet, 'FilterTahun');

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
      DataFilter: row.get(filterKey) || '',
      FilterTahun: row.get(yearKey) || ''
    }));
  } catch (error) { return []; }
};

export const getDashboardData = async (slug: string) => {
  try {
    const doc = await getDoc();
    const konfigSheet = doc.sheetsByTitle['Konfig'];
    const dataSheet = doc.sheetsByTitle['Data'];
    if (!konfigSheet || !dataSheet) return { meta: [], data: [] };

    await Promise.all([
        konfigSheet.loadHeaderRow(),
        dataSheet.loadHeaderRow()
    ]);

    const [konfigRows, dataRows] = await Promise.all([
      konfigSheet.getRows(),
      dataSheet.getRows()
    ]);

    const idKey = getHeader(konfigSheet, 'Id');
    const catKey = getHeader(konfigSheet, 'Kategori');
    const statusKey = getHeader(konfigSheet, 'Status');
    const filterKey = getHeader(konfigSheet, 'DataFilter');
    const yearKey = getHeader(konfigSheet, 'FilterTahun');
    
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();

    const activeConfig = konfigRows.filter(row => {
      const rawCat = row.get(catKey);
      const category = rawCat ? String(rawCat).toLowerCase().trim() : '';
      const status = row.get(statusKey);
      return category === decodedSlug && status === 'Aktif';
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
            const filterVal = String(filterStr).trim();
            
            if (filterVal.startsWith('!')) {
                const excludeVal = filterVal.substring(1).trim().toLowerCase();
                if (catStr === excludeVal) return false;
            } else {
                if (catStr !== filterVal.toLowerCase()) return false;
            }
        }

        const yearFilter = config?.get(yearKey);
        if (yearFilter && String(yearFilter).trim() !== '') {
            const rowYear = getRowValue(row, ['Tahun', 'tahun', 'Year', 'year']);
            if (String(rowYear) !== String(yearFilter).trim()) return false;
        }
        
        return true;
    }).map(row => {
      const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
      const config = activeConfig.find(c => c.get(idKey) === id);
      const labelKey = getHeader(konfigSheet, 'Label');
      
      return { 
          ...row, 
          id_variable: id,
          Tahun: getRowValue(row, ['Tahun', 'tahun', 'Year', 'year']),
          Nilai: getRowValue(row, ['Nilai', 'nilai', 'Value', 'value']),
          Satuan: getRowValue(row, ['Satuan', 'satuan', 'Unit', 'unit']),
          variable_name: config?.get(labelKey) || id,
          kategori_data: getRowValue(row, ['kategori', 'Kategori', 'category', 'Category', 'lapangan_usaha'])
      };
    });

    const metaData = activeConfig.map(r => ({
        Id: r.get(idKey),
        Label: r.get(getHeader(konfigSheet, 'Label')),
        Kategori: r.get(catKey),
        Status: r.get(statusKey),
        Deskripsi: r.get(getHeader(konfigSheet, 'Deskripsi')) || '',
        TipeGrafik: r.get(getHeader(konfigSheet, 'TipeGrafik')) || 'line',
        Warna: r.get(getHeader(konfigSheet, 'Warna')) || 'blue',
        TrendLogic: r.get(getHeader(konfigSheet, 'TrendLogic')) || 'UpIsGood',
        TargetRPJMD: r.get(getHeader(konfigSheet, 'TargetRPJMD')) || '',
        DataFilter: r.get(filterKey) || '',
        FilterTahun: r.get(yearKey) || ''
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

        await Promise.all([konfigSheet.loadHeaderRow(), dataSheet.loadHeaderRow()]);
        const [konfigRows, dataRows] = await Promise.all([konfigSheet.getRows(), dataSheet.getRows()]);

        const idKey = getHeader(konfigSheet, 'Id');
        const homeKey = getHeader(konfigSheet, 'ShowOnHome');
        const statusKey = getHeader(konfigSheet, 'Status');
        
        const homeConfig = konfigRows.filter(row => row.get(homeKey) === 'TRUE' && row.get(statusKey) === 'Aktif');
        const activeIds = new Set(homeConfig.map(row => row.get(idKey)));
        
        const rawData = dataRows.map(row => row.toObject());
        const associatedData = rawData.filter(row => activeIds.has(getRowValue(row, ['id_variable', 'var_id', 'Id'])));
        
        const filterKey = getHeader(konfigSheet, 'DataFilter');
        const yearKey = getHeader(konfigSheet, 'FilterTahun');

        const finalData = associatedData.filter(row => {
            const id = getRowValue(row, ['id_variable', 'var_id', 'Id']);
            const config = homeConfig.find(c => c.get(idKey) === id);
            
            const filterStr = config?.get(filterKey);
            if (filterStr && String(filterStr).trim() !== '') {
                const rowCat = getRowValue(row, ['kategori', 'Kategori', 'category', 'Category', 'lapangan_usaha', 'sub_kategori']);
                const catStr = rowCat ? String(rowCat).trim().toLowerCase() : '';
                const filterVal = String(filterStr).trim();
                if (filterVal.startsWith('!')) {
                    if (catStr === filterVal.substring(1).trim().toLowerCase()) return false;
                } else {
                    if (catStr !== filterVal.toLowerCase()) return false;
                }
            }
            const yearFilter = config?.get(yearKey);
            if (yearFilter && String(yearFilter).trim() !== '') {
                const rowYear = getRowValue(row, ['Tahun', 'tahun', 'Year', 'year']);
                if (String(rowYear) !== String(yearFilter).trim()) return false;
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
                variable_name: config?.get(getHeader(konfigSheet, 'Label')) || id,
                kategori_data: getRowValue(row, ['kategori', 'Kategori', 'category', 'Category', 'lapangan_usaha'])
            };
        });

        const metaData = homeConfig.map(r => ({
            Id: r.get(idKey),
            Label: r.get(getHeader(konfigSheet, 'Label')),
            Kategori: r.get(getHeader(konfigSheet, 'Kategori')),
            Status: r.get(statusKey),
            Deskripsi: r.get(getHeader(konfigSheet, 'Deskripsi')) || '',
            TipeGrafik: r.get(getHeader(konfigSheet, 'TipeGrafik')) || 'line',
            Warna: r.get(getHeader(konfigSheet, 'Warna')) || 'blue',
            TrendLogic: r.get(getHeader(konfigSheet, 'TrendLogic')) || 'UpIsGood',
            TargetRPJMD: r.get(getHeader(konfigSheet, 'TargetRPJMD')) || '',
            DataFilter: r.get(filterKey) || '',
            FilterTahun: r.get(yearKey) || ''
        }));
        
        return { meta: metaData, data: finalData };
    } catch (error) { return { meta: [], data: [] }; }
};

export const getNavLinks = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Konfig'];
    if(!sheet) return [];
    await sheet.loadHeaderRow();
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

export const updateKonfig = async (id: string, updates: any) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle['Konfig'];
  await sheet.loadHeaderRow(); 
  const rows = await sheet.getRows();
  
  const idKey = getHeader(sheet, 'Id');
  const row = rows.find(r => r.get(idKey) === id);
  
  if (row) {
    const newValues: any = {};
    const keys = ['Status', 'Kategori', 'Deskripsi', 'TipeGrafik', 'Warna', 'TrendLogic', 'ShowOnHome', 'TargetRPJMD', 'DataFilter', 'FilterTahun', 'Label'];
    
    keys.forEach(k => {
        if (updates[k] !== undefined) newValues[getHeader(sheet, k)] = updates[k];
    });
    
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
        await sheet.loadHeaderRow(); 
        const rowData: any = {};
        const keys = ['Id', 'Label', 'Kategori', 'Status', 'Deskripsi', 'TipeGrafik', 'Warna', 'TrendLogic', 'ShowOnHome', 'TargetRPJMD', 'DataFilter', 'FilterTahun'];
        keys.forEach(k => {
             rowData[getHeader(sheet, k)] = newData[k];
        });
        await sheet.addRow(rowData);
    }
};

export const replaceDataForVariable = async (varId: string, newRows: any[]) => {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Data'];
    if (!sheet) {
        sheet = await doc.addSheet({ title: 'Data', headerValues: ['id_variable', 'Tahun', 'Nilai', 'Satuan', 'kategori', 'id_domain', 'Periode'] });
    }
    
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    const rowsToDelete = rows.filter(r => {
        const rId = getRowValue(r, ['id_variable', 'var_id', 'Id']);
        return String(rId) === String(varId);
    });

    for (const row of rowsToDelete.reverse()) {
        await row.delete();
    }
    
    if (newRows.length > 0) {
        await sheet.addRows(newRows);
    }
};

// === ANALYSIS FUNCTIONS (NEW) ===

export const getAnalysisConfig = async () => {
  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['AnalysisConfig'];
    if (!sheet) {
        sheet = await doc.addSheet({ 
            title: 'AnalysisConfig', 
            // Updated Headers
            headerValues: ['Id', 'Title', 'Category', 'Description', 'ChartType', 'SheetName', 'XAxisCol', 'YAxisCol', 'Status', 'TooltipCol'] 
        });
    }
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const getVal = (row: any, key: string) => row.get(getHeader(sheet, key));

    return rows.map(row => ({
      Id: getVal(row, 'Id'),
      Title: getVal(row, 'Title'),
      Category: getVal(row, 'Category'),
      Description: getVal(row, 'Description'),
      ChartType: getVal(row, 'ChartType'),
      SheetName: getVal(row, 'SheetName'),
      XAxisCol: getVal(row, 'XAxisCol'),
      YAxisCol: getVal(row, 'YAxisCol'),
      Status: getVal(row, 'Status') || 'Non-Aktif',
      TooltipCol: getVal(row, 'TooltipCol') || '', // Reading TooltipCol
      _rowNumber: row.rowNumber
    }));
  } catch (error) { 
    console.error("Error fetching analysis config:", error);
    return []; 
  }
};

export const saveAnalysisConfig = async (data: any) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['AnalysisConfig'];
    if (!sheet) throw new Error("AnalysisConfig sheet not found");
    
    await sheet.loadHeaderRow();
    const idKey = getHeader(sheet, 'Id');
    
    const keys = ['Title', 'Category', 'Description', 'ChartType', 'SheetName', 'XAxisCol', 'YAxisCol', 'Status', 'TooltipCol'];

    if (data.Id) {
        const rows = await sheet.getRows();
        const row = rows.find(r => r.get(idKey) === data.Id);
        
        if (row) {
            const updates: any = {};
            keys.forEach(k => {
                if (data[k] !== undefined) updates[getHeader(sheet, k)] = data[k];
            });
            row.assign(updates);
            await row.save();
            return;
        }
    }
    
    const newRow: any = {};
    const allKeys = ['Id', ...keys];
    allKeys.forEach(k => {
        newRow[getHeader(sheet, k)] = data[k];
    });
    if (!newRow[getHeader(sheet, 'Id')]) {
        newRow[getHeader(sheet, 'Id')] = 'ANL-' + Date.now();
    }
    
    await sheet.addRow(newRow);
};

export const deleteAnalysisConfig = async (id: string) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['AnalysisConfig'];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const idKey = getHeader(sheet, 'Id');
    const row = rows.find(r => r.get(idKey) === id);
    if (row) await row.delete();
};

export const getAnalysisData = async (sheetName: string) => {
    if (!sheetName) return [];
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) return [];
        
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();
        return rows.map(row => row.toObject());
    } catch (e) {
        console.error(`Error fetching data from sheet ${sheetName}:`, e);
        return [];
    }
};