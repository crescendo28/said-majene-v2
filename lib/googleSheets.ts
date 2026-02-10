import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// =====================
// ENV
// =====================
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SERVICE_ACCOUNT_EMAIL) console.warn("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
if (!PRIVATE_KEY) console.warn("Missing GOOGLE_PRIVATE_KEY");
if (!SHEET_ID) console.warn("Missing GOOGLE_SHEET_ID");

const auth = new JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// =====================
// DOC HELPER
// =====================
async function getDoc() {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID is missing");
  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
}

// =====================
// UTIL HELPERS
// =====================
const normalizeKey = (val: string) => String(val || "").toLowerCase().trim();

const getHeader = (sheet: any, target: string) => {
  if (!sheet.headerValues) return target;

  const normalizedTarget = normalizeKey(target);
  const found = sheet.headerValues.find(
    (h: string) => normalizeKey(h) === normalizedTarget
  );

  return found || target;
};

const getRowValue = (row: any, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }

  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const foundKey = rowKeys.find((k) => normalizeKey(k) === normalizeKey(key));
    if (foundKey) return row[foundKey];
  }

  return undefined;
};

/**
 * Ambil SEMUA rows tanpa kena limit default getRows().
 * Ini penting supaya delete/replace ga salah row.
 */
async function getAllRows(sheet: GoogleSpreadsheetWorksheet, pageSize = 500) {
  let offset = 0;
  let allRows: any[] = [];

  while (true) {
    const rows = await sheet.getRows({ offset, limit: pageSize });
    allRows = allRows.concat(rows);

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}

/**
 * Add rows dengan chunk biar aman dari quota / request terlalu besar.
 */
async function addRowsChunked(
  sheet: GoogleSpreadsheetWorksheet,
  rows: any[],
  chunkSize = 200
) {
  if (!rows || rows.length === 0) return;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await sheet.addRows(chunk);
  }
}

// =====================
// GENERIC DATA ACCESS
// =====================
export const getSheetData = async (sheetName: string) => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return [];

    await sheet.loadHeaderRow();

    // Ambil semua rows biar konsisten
    const rows = await getAllRows(sheet);
    return rows.map((row) => row.toObject());
  } catch (error) {
    console.error(`getSheetData(${sheetName}) error:`, error);
    return [];
  }
};

// =====================
// SETTINGS
// =====================
export const getGlobalSettings = async () => {
  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle["Settings"];

    if (!sheet) {
      try {
        sheet = await doc.addSheet({
          title: "Settings",
          headerValues: ["Key", "Value"],
        });
      } catch (e) {
        console.error("Could not create Settings sheet:", e);
        return {};
      }
    }

    await sheet.loadHeaderRow();

    const rows = await getAllRows(sheet);
    const settings: Record<string, string> = {};

    rows.forEach((row) => {
      const k = row.get("Key");
      const v = row.get("Value");
      if (k) settings[String(k)] = String(v ?? "");
    });

    return settings;
  } catch (error) {
    console.error("getGlobalSettings error:", error);
    return {};
  }
};

export const saveGlobalSetting = async (key: string, value: string) => {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle["Settings"];

  if (!sheet) {
    sheet = await doc.addSheet({
      title: "Settings",
      headerValues: ["Key", "Value"],
    });
  }

  await sheet.loadHeaderRow();

  const rows = await getAllRows(sheet);
  const existing = rows.find((r) => r.get("Key") === key);

  if (existing) {
    existing.assign({ Value: value });
    await existing.save();
  } else {
    await sheet.addRow({ Key: key, Value: value });
  }
};

// =====================
// METADATA
// =====================
export const getMetadata = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle["Metadata"];
    if (!sheet) return [];

    await sheet.loadHeaderRow();

    const rows = await getAllRows(sheet);
    return rows.map((row) => row.toObject());
  } catch (error) {
    console.error("getMetadata error:", error);
    return [];
  }
};

// =====================
// KONFIG
// =====================
export const getAllVariables = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle["Konfig"];
    if (!sheet) return [];

    await sheet.loadHeaderRow();

    const rows = await getAllRows(sheet);

    const idKey = getHeader(sheet, "Id");
    const labelKey = getHeader(sheet, "Label");
    const catKey = getHeader(sheet, "Kategori");
    const statusKey = getHeader(sheet, "Status");
    const descKey = getHeader(sheet, "Deskripsi");
    const typeKey = getHeader(sheet, "TipeGrafik");
    const colorKey = getHeader(sheet, "Warna");
    const trendKey = getHeader(sheet, "TrendLogic");
    const homeKey = getHeader(sheet, "ShowOnHome");
    const targetKey = getHeader(sheet, "TargetRPJMD");
    const filterKey = getHeader(sheet, "DataFilter");
    const yearKey = getHeader(sheet, "FilterTahun");

    return rows.map((row) => ({
      Id: row.get(idKey),
      Label: row.get(labelKey),
      Kategori: row.get(catKey) || "Uncategorized",
      Status: row.get(statusKey) || "Non-Aktif",
      Deskripsi: row.get(descKey) || "",
      TipeGrafik: row.get(typeKey) || "line",
      Warna: row.get(colorKey) || "blue",
      TrendLogic: row.get(trendKey) || "UpIsGood",
      ShowOnHome: row.get(homeKey) === "TRUE",
      TargetRPJMD: row.get(targetKey) || "",
      DataFilter: row.get(filterKey) || "",
      FilterTahun: row.get(yearKey) || "",
    }));
  } catch (error) {
    console.error("getAllVariables error:", error);
    return [];
  }
};

// =====================
// DASHBOARD DATA
// =====================
export const getDashboardData = async (slug: string) => {
  try {
    const doc = await getDoc();
    const konfigSheet = doc.sheetsByTitle["Konfig"];
    const dataSheet = doc.sheetsByTitle["Data"];
    if (!konfigSheet || !dataSheet) return { meta: [], data: [] };

    await Promise.all([konfigSheet.loadHeaderRow(), dataSheet.loadHeaderRow()]);

    const [konfigRows, dataRows] = await Promise.all([
      getAllRows(konfigSheet),
      getAllRows(dataSheet),
    ]);

    const idKey = getHeader(konfigSheet, "Id");
    const catKey = getHeader(konfigSheet, "Kategori");
    const statusKey = getHeader(konfigSheet, "Status");
    const filterKey = getHeader(konfigSheet, "DataFilter");
    const yearKey = getHeader(konfigSheet, "FilterTahun");
    const labelKey = getHeader(konfigSheet, "Label");

    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();

    const activeConfig = konfigRows.filter((row) => {
      const rawCat = row.get(catKey);
      const category = rawCat ? String(rawCat).toLowerCase().trim() : "";
      const status = row.get(statusKey);
      return category === decodedSlug && status === "Aktif";
    });

    const activeIds = new Set(activeConfig.map((row) => row.get(idKey)));

    const rawData = dataRows.map((row) => row.toObject());

    const associatedData = rawData.filter((row) => {
      const id = getRowValue(row, ["id_variable", "var_id", "Id"]);
      return activeIds.has(id);
    });

    const finalData = associatedData
      .filter((row) => {
        const id = getRowValue(row, ["id_variable", "var_id", "Id"]);
        const config = activeConfig.find((c) => c.get(idKey) === id);

        const filterStr = config?.get(filterKey);
        if (filterStr && String(filterStr).trim() !== "") {
          const rowCat = getRowValue(row, [
            "kategori",
            "Kategori",
            "category",
            "Category",
            "lapangan_usaha",
            "sub_kategori",
          ]);

          const catStr = rowCat ? String(rowCat).trim().toLowerCase() : "";
          const filterVal = String(filterStr).trim();

          if (filterVal.startsWith("!")) {
            const excludeVal = filterVal.substring(1).trim().toLowerCase();
            if (catStr === excludeVal) return false;
          } else {
            if (catStr !== filterVal.toLowerCase()) return false;
          }
        }

        const yearFilter = config?.get(yearKey);
        if (yearFilter && String(yearFilter).trim() !== "") {
          const rowYear = getRowValue(row, ["Tahun", "tahun", "Year", "year"]);
          if (String(rowYear) !== String(yearFilter).trim()) return false;
        }

        return true;
      })
      .map((row) => {
        const id = getRowValue(row, ["id_variable", "var_id", "Id"]);
        const config = activeConfig.find((c) => c.get(idKey) === id);

        return {
          ...row,
          id_variable: id,
          Tahun: getRowValue(row, ["Tahun", "tahun", "Year", "year"]),
          Nilai: getRowValue(row, ["Nilai", "nilai", "Value", "value"]),
          Satuan: getRowValue(row, ["Satuan", "satuan", "Unit", "unit"]),
          variable_name: config?.get(labelKey) || id,
          kategori_data: getRowValue(row, [
            "kategori",
            "Kategori",
            "category",
            "Category",
            "lapangan_usaha",
          ]),
        };
      });

    const metaData = activeConfig.map((r) => ({
      Id: r.get(idKey),
      Label: r.get(labelKey),
      Kategori: r.get(catKey),
      Status: r.get(statusKey),
      Deskripsi: r.get(getHeader(konfigSheet, "Deskripsi")) || "",
      TipeGrafik: r.get(getHeader(konfigSheet, "TipeGrafik")) || "line",
      Warna: r.get(getHeader(konfigSheet, "Warna")) || "blue",
      TrendLogic: r.get(getHeader(konfigSheet, "TrendLogic")) || "UpIsGood",
      TargetRPJMD: r.get(getHeader(konfigSheet, "TargetRPJMD")) || "",
      DataFilter: r.get(filterKey) || "",
      FilterTahun: r.get(yearKey) || "",
    }));

    return { meta: metaData, data: finalData };
  } catch (error) {
    console.error("getDashboardData error:", error);
    return { meta: [], data: [] };
  }
};

// =====================
// HOME DATA
// =====================
export const getHomeData = async () => {
  try {
    const doc = await getDoc();
    const konfigSheet = doc.sheetsByTitle["Konfig"];
    const dataSheet = doc.sheetsByTitle["Data"];
    if (!konfigSheet || !dataSheet) return { meta: [], data: [] };

    await Promise.all([konfigSheet.loadHeaderRow(), dataSheet.loadHeaderRow()]);

    const [konfigRows, dataRows] = await Promise.all([
      getAllRows(konfigSheet),
      getAllRows(dataSheet),
    ]);

    const idKey = getHeader(konfigSheet, "Id");
    const homeKey = getHeader(konfigSheet, "ShowOnHome");
    const statusKey = getHeader(konfigSheet, "Status");
    const filterKey = getHeader(konfigSheet, "DataFilter");
    const yearKey = getHeader(konfigSheet, "FilterTahun");
    const labelKey = getHeader(konfigSheet, "Label");

    const homeConfig = konfigRows.filter(
      (row) => row.get(homeKey) === "TRUE" && row.get(statusKey) === "Aktif"
    );

    const activeIds = new Set(homeConfig.map((row) => row.get(idKey)));

    const rawData = dataRows.map((row) => row.toObject());
    const associatedData = rawData.filter((row) =>
      activeIds.has(getRowValue(row, ["id_variable", "var_id", "Id"]))
    );

    const finalData = associatedData
      .filter((row) => {
        const id = getRowValue(row, ["id_variable", "var_id", "Id"]);
        const config = homeConfig.find((c) => c.get(idKey) === id);

        const filterStr = config?.get(filterKey);
        if (filterStr && String(filterStr).trim() !== "") {
          const rowCat = getRowValue(row, [
            "kategori",
            "Kategori",
            "category",
            "Category",
            "lapangan_usaha",
            "sub_kategori",
          ]);

          const catStr = rowCat ? String(rowCat).trim().toLowerCase() : "";
          const filterVal = String(filterStr).trim();

          if (filterVal.startsWith("!")) {
            if (catStr === filterVal.substring(1).trim().toLowerCase())
              return false;
          } else {
            if (catStr !== filterVal.toLowerCase()) return false;
          }
        }

        const yearFilter = config?.get(yearKey);
        if (yearFilter && String(yearFilter).trim() !== "") {
          const rowYear = getRowValue(row, ["Tahun", "tahun", "Year", "year"]);
          if (String(rowYear) !== String(yearFilter).trim()) return false;
        }

        return true;
      })
      .map((row) => {
        const id = getRowValue(row, ["id_variable", "var_id", "Id"]);
        const config = homeConfig.find((c) => c.get(idKey) === id);

        return {
          ...row,
          id_variable: id,
          Tahun: getRowValue(row, ["Tahun", "tahun", "Year", "year"]),
          Nilai: getRowValue(row, ["Nilai", "nilai", "Value", "value"]),
          Satuan: getRowValue(row, ["Satuan", "satuan", "Unit", "unit"]),
          variable_name: config?.get(labelKey) || id,
          kategori_data: getRowValue(row, [
            "kategori",
            "Kategori",
            "category",
            "Category",
            "lapangan_usaha",
          ]),
        };
      });

    const metaData = homeConfig.map((r) => ({
      Id: r.get(idKey),
      Label: r.get(labelKey),
      Kategori: r.get(getHeader(konfigSheet, "Kategori")),
      Status: r.get(statusKey),
      Deskripsi: r.get(getHeader(konfigSheet, "Deskripsi")) || "",
      TipeGrafik: r.get(getHeader(konfigSheet, "TipeGrafik")) || "line",
      Warna: r.get(getHeader(konfigSheet, "Warna")) || "blue",
      TrendLogic: r.get(getHeader(konfigSheet, "TrendLogic")) || "UpIsGood",
      TargetRPJMD: r.get(getHeader(konfigSheet, "TargetRPJMD")) || "",
      DataFilter: r.get(filterKey) || "",
      FilterTahun: r.get(yearKey) || "",
    }));

    return { meta: metaData, data: finalData };
  } catch (error) {
    console.error("getHomeData error:", error);
    return { meta: [], data: [] };
  }
};

// =====================
// NAV LINKS
// =====================
export const getNavLinks = async () => {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle["Konfig"];
    if (!sheet) return [];

    await sheet.loadHeaderRow();
    const rows = await getAllRows(sheet);

    const catKey = getHeader(sheet, "Kategori");
    const statusKey = getHeader(sheet, "Status");

    const categories = new Set<string>();

    rows.forEach((row) => {
      const cat = row.get(catKey);
      if (cat && row.get(statusKey) === "Aktif") {
        categories.add(
          cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
        );
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error("getNavLinks error:", error);
    return [];
  }
};

// =====================
// UPDATE KONFIG
// =====================
export const updateKonfig = async (id: string, updates: any) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Konfig"];
  if (!sheet) throw new Error("Konfig sheet not found");

  await sheet.loadHeaderRow();

  const rows = await getAllRows(sheet);
  const idKey = getHeader(sheet, "Id");

  const row = rows.find((r) => r.get(idKey) === id);
  if (!row) return;

  const keys = [
    "Status",
    "Kategori",
    "Deskripsi",
    "TipeGrafik",
    "Warna",
    "TrendLogic",
    "ShowOnHome",
    "TargetRPJMD",
    "DataFilter",
    "FilterTahun",
    "Label",
  ];

  const newValues: any = {};

  keys.forEach((k) => {
    if (updates[k] !== undefined) {
      newValues[getHeader(sheet, k)] = updates[k];
    }
  });

  if (Object.keys(newValues).length > 0) {
    row.assign(newValues);
    await row.save();
  }
};

// =====================
// ADD KONFIG ROW
// =====================
export const addKonfigRow = async (newData: any) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Konfig"];
  if (!sheet) throw new Error("Konfig sheet not found");

  await sheet.loadHeaderRow();

  const keys = [
    "Id",
    "Label",
    "Kategori",
    "Status",
    "Deskripsi",
    "TipeGrafik",
    "Warna",
    "TrendLogic",
    "ShowOnHome",
    "TargetRPJMD",
    "DataFilter",
    "FilterTahun",
  ];

  const rowData: any = {};
  keys.forEach((k) => {
    rowData[getHeader(sheet, k)] = newData[k];
  });

  await sheet.addRow(rowData);
};

// =====================
// IMPORTANT FIX: REPLACE DATA VARIABLE
// =====================
export const replaceDataForVariable = async (varId: string, newRows: any[]) => {
  const doc = await getDoc();

  let sheet = doc.sheetsByTitle["Data"];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: "Data",
      headerValues: [
        "id_variable",
        "Tahun",
        "Nilai",
        "Satuan",
        "kategori",
        "id_domain",
        "Periode",
      ],
    });
  }

  await sheet.loadHeaderRow();

  // FIX UTAMA: pakai getAllRows biar ga cuma ambil 10 / 100 row pertama
  const rows = await getAllRows(sheet);

  const rowsToDelete = rows.filter((r) => {
    const rId = r.get(getHeader(sheet, "id_variable"));
    return String(rId) === String(varId);
  });

  // delete dari bawah biar rowNumber ga shifting
  for (const row of rowsToDelete.reverse()) {
    await row.delete();
  }

  if (newRows && newRows.length > 0) {
    // addRows chunked biar ga nabrak limit
    await addRowsChunked(sheet, newRows, 200);
  }
};

// =====================
// ANALYSIS CONFIG
// =====================
export const getAnalysisConfig = async () => {
  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle["AnalysisConfig"];

    if (!sheet) {
      sheet = await doc.addSheet({
        title: "AnalysisConfig",
        headerValues: [
          "Id",
          "Title",
          "Category",
          "Description",
          "ChartType",
          "SheetName",
          "XAxisCol",
          "YAxisCol",
          "Status",
          "TooltipCol",
        ],
      });
    }

    await sheet.loadHeaderRow();

    const rows = await getAllRows(sheet);

    const getVal = (row: any, key: string) => row.get(getHeader(sheet, key));

    return rows.map((row) => ({
      Id: getVal(row, "Id"),
      Title: getVal(row, "Title"),
      Category: getVal(row, "Category"),
      Description: getVal(row, "Description"),
      ChartType: getVal(row, "ChartType"),
      SheetName: getVal(row, "SheetName"),
      XAxisCol: getVal(row, "XAxisCol"),
      YAxisCol: getVal(row, "YAxisCol"),
      Status: getVal(row, "Status") || "Non-Aktif",
      TooltipCol: getVal(row, "TooltipCol") || "",
      _rowNumber: row.rowNumber,
    }));
  } catch (error) {
    console.error("Error fetching analysis config:", error);
    return [];
  }
};

export const saveAnalysisConfig = async (data: any) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["AnalysisConfig"];
  if (!sheet) throw new Error("AnalysisConfig sheet not found");

  await sheet.loadHeaderRow();

  const idKey = getHeader(sheet, "Id");
  const keys = [
    "Title",
    "Category",
    "Description",
    "ChartType",
    "SheetName",
    "XAxisCol",
    "YAxisCol",
    "Status",
    "TooltipCol",
  ];

  if (data.Id) {
    const rows = await getAllRows(sheet);
    const row = rows.find((r) => r.get(idKey) === data.Id);

    if (row) {
      const updates: any = {};
      keys.forEach((k) => {
        if (data[k] !== undefined) updates[getHeader(sheet, k)] = data[k];
      });

      row.assign(updates);
      await row.save();
      return;
    }
  }

  const newRow: any = {};
  const allKeys = ["Id", ...keys];

  allKeys.forEach((k) => {
    newRow[getHeader(sheet, k)] = data[k];
  });

  if (!newRow[getHeader(sheet, "Id")]) {
    newRow[getHeader(sheet, "Id")] = "ANL-" + Date.now();
  }

  await sheet.addRow(newRow);
};

export const deleteAnalysisConfig = async (id: string) => {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["AnalysisConfig"];
  if (!sheet) throw new Error("AnalysisConfig sheet not found");

  await sheet.loadHeaderRow();

  const rows = await getAllRows(sheet);
  const idKey = getHeader(sheet, "Id");

  const row = rows.find((r) => r.get(idKey) === id);
  if (row) await row.delete();
};

// =====================
// ANALYSIS DATA
// =====================
export const getAnalysisData = async (sheetName: string) => {
  if (!sheetName) return [];

  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return [];

    await sheet.loadHeaderRow();

    const rows = await getAllRows(sheet);
    return rows.map((row) => row.toObject());
  } catch (e) {
    console.error(`Error fetching data from sheet ${sheetName}:`, e);
    return [];
  }
};
