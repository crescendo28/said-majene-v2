'use client';

import { useState } from 'react';
import { saveConfig, createIndicator, initSync, processSyncItem, finishSync } from '@/app/actions';
import { Search, Plus, Save, RefreshCw, X, Loader2, Database, CheckCircle, Play, ArrowRight } from 'lucide-react';

interface AdminPanelProps {
  konfigData: any[];
  metadata: any[];
}

export default function AdminPanel({ konfigData, metadata }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // Modal Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const filteredData = konfigData.filter(row => 
    row.Label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.Id?.includes(searchTerm) ||
    row.Kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(konfigData.map((r: any) => r.Kategori).filter(Boolean)));

  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleMetadataSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedMeta = metadata.find(m => m.var_id == selectedId);
    if (selectedMeta) {
        setNewId(selectedMeta.var_id);
        setNewLabel(selectedMeta['Nama Variabel'] || selectedMeta.Label || '');
    }
  };

  // --- 1. SMART SAVE (Add & Sync One Item) ---
  const handleSmartSave = async (formData: FormData) => {
    setIsSaving(true);
    setSaveStatus('Menyimpan Konfigurasi...');
    
    try {
        // A. Save to Config Sheet
        await createIndicator(null, formData);
        
        setSaveStatus('Mengambil Data dari BPS...');
        
        // B. Fetch Data ONLY for this new ID
        const id = formData.get('id') as string;
        const res = await processSyncItem(id); // Use existing action for single item
        
        if(res.success) {
            setSaveStatus(`Berhasil! ${res.count} data ditambahkan.`);
            // C. Refresh Dashboard Cache
            await finishSync(); 
        } else {
            setSaveStatus('Config tersimpan, tapi gagal ambil data.');
        }

        // Close after brief delay
        setTimeout(() => {
            setIsModalOpen(false);
            setIsSaving(false);
            setSaveStatus('');
            setNewId('');
            setNewLabel('');
        }, 1500);

    } catch (error) {
        setSaveStatus('Terjadi kesalahan.');
        setIsSaving(false);
    }
  };

  // --- 2. FULL SYNC (Maintenance Mode) ---
  const startFullSync = async () => {
    if(!confirm("Mode Pemeliharaan: Ini akan MENGHAPUS semua data lama dan mengambil ulang dari BPS untuk memastikan konsistensi. Lanjutkan?")) return;

    setIsSyncing(true);
    setProgress(0);
    setLogs([]);
    setStatusText("Menginisialisasi... (Membersihkan Sheet)");

    try {
        const init = await initSync();
        if(!init.success || !init.queue) throw new Error("Gagal inisialisasi");

        const queue = init.queue;
        const total = queue.length;
        
        setLogs(prev => [`Found ${total} active variables. Starting fetch...`, ...prev]);

        for (let i = 0; i < total; i++) {
            const item = queue[i];
            setStatusText(`Memproses (${i+1}/${total}): ${item.label.substring(0, 30)}...`);
            
            const res = await processSyncItem(item.id);
            
            if (res.success) {
                setLogs(prev => [`✅ ${item.id}: Fetched ${res.count} rows`, ...prev]);
            } else {
                setLogs(prev => [`❌ ${item.id}: Failed to fetch`, ...prev]);
            }

            setProgress(Math.round(((i + 1) / total) * 100));
        }

        await finishSync();
        setStatusText("Selesai! Data berhasil diperbarui.");
        setTimeout(() => setIsSyncing(false), 3000);

    } catch (error) {
        console.error(error);
        setStatusText("Terjadi Kesalahan fatal.");
        setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold mr-3 text-white">M</div>
            <span className="font-bold text-lg tracking-wide">Admin SAID</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="flex items-center px-4 py-3 bg-slate-800 text-white rounded-xl">
                <Database className="w-5 h-5 mr-3" />
                <span className="font-medium">Master Data</span>
            </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 sticky top-0 z-20">
            <h2 className="text-xl font-bold text-slate-800">Konfigurasi Indikator</h2>
            <div className="text-xs text-slate-500">
                Data Source: <span className="font-bold text-emerald-600">BPS Web API</span>
            </div>
        </header>

        <div className="p-8">
            
            {/* FULL SYNC STATUS PANEL */}
            {isSyncing && (
                <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2">
                            <Loader2 className="animate-spin"/> {statusText}
                        </h4>
                        <span className="font-mono font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="mt-4 h-32 overflow-y-auto bg-slate-900 text-slate-300 p-3 rounded-lg text-xs font-mono">
                        {logs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                </div>
            )}

            {/* ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Cari indikator..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={startFullSync}
                        disabled={isSyncing}
                        className={`px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${isSyncing ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        title="Jalankan ini hanya jika ada error data atau update tahunan."
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'hidden' : ''}`} />
                        {isSyncing ? 'Sinkronisasi...' : 'Full Sync (Maintenance)'}
                    </button>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Tambah Indikator
                    </button>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-5 border-b border-slate-200">ID</th>
                                <th className="p-5 border-b border-slate-200 w-1/3">Label Indikator</th>
                                <th className="p-5 border-b border-slate-200">Kategori</th>
                                <th className="p-5 border-b border-slate-200">Status</th>
                                <th className="p-5 border-b border-slate-200 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {filteredData.map((row: any) => (
                                <tr key={row.Id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5 font-mono text-slate-400">{row.Id}</td>
                                    <td className="p-5 font-bold text-slate-900">{row.Label}</td>
                                    <td className="p-5">
                                        <form action={saveConfig} className="flex gap-2 items-center">
                                            <input type="hidden" name="id" value={row.Id} />
                                            <input name="category" defaultValue={row.Kategori} list="category-list" className="w-24 px-2 py-1 border rounded text-xs bg-slate-50"/>
                                            <select name="status" defaultValue={row.Status} className="px-2 py-1 border rounded text-xs bg-slate-50">
                                                <option value="Aktif">Aktif</option>
                                                <option value="Non-Aktif">Off</option>
                                            </select>
                                            <button className="text-blue-600 hover:text-blue-800"><Save className="w-4 h-4"/></button>
                                        </form>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.Status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.Status}</span>
                                    </td>
                                    <td className="p-5 text-right text-slate-400">Edit</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* MODAL ADD */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                    <h3 className="text-2xl font-bold mb-6 text-slate-900">Tambah Indikator Baru</h3>
                    
                    <form action={handleSmartSave}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cari Metadata API</label>
                                <select onChange={handleMetadataSelect} className="w-full border border-slate-300 p-2.5 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Pilih Variabel --</option>
                                    {metadata.map((m: any) => <option key={m.var_id} value={m.var_id}>{m.var_id} - {m['Nama Variabel']}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Variable</label>
                                <input name="id" value={newId} readOnly className="w-full border border-slate-300 p-2.5 rounded-lg bg-slate-100 text-slate-500 font-mono text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label Tampilan</label>
                                <input name="label" value={newLabel} onChange={e=>setNewLabel(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"/>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori Dashboard</label>
                                <input name="category" list="category-list" placeholder="e.g. ekonomi" className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required/>
                            </div>
                        </div>

                        {/* Status Bar */}
                        {isSaving && (
                            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 p-2 rounded-lg">
                                <Loader2 className="animate-spin w-4 h-4" /> {saveStatus}
                            </div>
                        )}

                        <div className="mt-6 flex gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Batal</button>
                            <button type="submit" disabled={isSaving} className="w-1/2 p-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:bg-slate-400 flex items-center justify-center gap-2">
                                {isSaving ? 'Memproses...' : 'Simpan & Sync'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        <datalist id="category-list">
            {categories.map((c: any) => <option key={c} value={c} />)}
        </datalist>
      </main>
    </div>
  );
}