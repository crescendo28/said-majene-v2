const API_KEY = process.env.BPS_API_KEY; 
const DOMAIN_ID = "7601"; 

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://webapi.bps.go.id/developer/',
  'Origin': 'https://webapi.bps.go.id',
};

const PETA_BULAN: Record<string, number> = {
  "januari": 1, "februari": 2, "maret": 3, "april": 4, 
  "mei": 5, "juni": 6, "juli": 7, "agustus": 8, 
  "september": 9, "oktober": 10, "november": 11, "desember": 12, "tahun" : 0
};

async function fetchBps(url: string) {
    try {
        const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
        if (!res.ok) {
            console.error(`BPS API Error ${res.status}: ${res.statusText}`);
            return null;
        }
        const text = await res.text();
        if (!text || text.trim().length === 0) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("BPS Fetch Error:", error);
        return null;
    }
}

async function getYearIds(varId: string) {
    let allYearIds: number[] = [];
    let page = 1;
    let totalPages = 1;

    const MAX_PAGES = 20; 

    do {
        const url = `https://webapi.bps.go.id/v1/api/list/model/th/domain/${DOMAIN_ID}/var/${varId}/page/${page}/key/${API_KEY}/`;
        const json = await fetchBps(url);

        if (json && json.status === "OK" && json['data-availability'] === 'available') {
            if (page === 1 && json.data && json.data[0]) {
                 totalPages = json.data[0].pages;
            }
            
            if (json.data && json.data[1]) {
                const ids = json.data[1].map((item: any) => item.th_id);
                allYearIds.push(...ids);
            }
        } else {
            console.warn(`No year data available for varId ${varId} on page ${page}`);
            break; 
        }
        page++;
    } while (page <= totalPages && page <= MAX_PAGES);

    return allYearIds;
}

// ambil data dari webAPI
export async function fetchVariableData(varId: string) {
    console.log(`Fetching available years for variable ${varId}...`);
    const yearIds = await getYearIds(varId);
    
    if (yearIds.length === 0) {
        console.warn(`No years found for variable ${varId}. Skipping data fetch.`);
        return [];
    }

    console.log(`Found ${yearIds.length} years for variable ${varId}. Fetching data...`);

    // limit data per dua tahun
    const chunks = [];
    for (let i = 0; i < yearIds.length; i += 2) { // Conservative chunk size of 2
        chunks.push(yearIds.slice(i, i + 2));
    }

    let allRows: any[] = [];

    for (const chunk of chunks) {
        const yearParam = chunk.join(':'); 
       
        const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/${DOMAIN_ID}/var/${varId}/th/${yearParam}/key/${API_KEY}/`;
        
        const json = await fetchBps(url);
        
        if (json && json.status === "OK" && json.datacontent) {
            const rows = processJsonToRows(json, varId);
            allRows.push(...rows);
        } else {
            console.warn(`Failed to fetch data chunk for years ${yearParam}`);
        }
    }

    return allRows;
}

// transform untuk masuk ke google sheet
function processJsonToRows(json: any, requestedVarId: string) {
    const rows: any[] = [];
    
    if (!json.var || !json.vervar || !json.tahun || !json.turtahun || !json.datacontent) {
        return [];
    }

    const varInfo = json.var[0];
    const turvarId = json.turvar ? json.turvar[0].val : 0; 

    json.vervar.forEach((cat: any) => {
        const idKategori = cat.val;
        const namaKategori = cat.label;

        json.tahun.forEach((th: any) => {
            const tahunId = th.val;
            const tahunAngka = th.label;

            json.turtahun.forEach((period: any) => {
                const periodId = period.val;
                const labelLower = period.label.toLowerCase();
                const periodNum = PETA_BULAN[labelLower];

                if (periodNum !== undefined) {
                    
                    const key = String(idKategori) + String(varInfo.val) + String(turvarId) + String(tahunId) + String(periodId);
                    
                    if (json.datacontent[key] !== undefined) {
                        
                        const tgl = `01/${String(periodNum).padStart(2,'0')}/${tahunAngka}`;
                        
                        
                        rows.push({
                            id_domain: DOMAIN_ID,
                            kategori: namaKategori,
                            Tahun: tahunAngka,
                            Periode: periodNum,
                            'Pilih Tahun': tgl,
                            id_variable: requestedVarId, 
                            'Nama Variabel': varInfo.label,
                            Nilai: json.datacontent[key],
                            Satuan: varInfo.unit
                        });
                    }
                }
            });
        });
    });
    return rows;
}
