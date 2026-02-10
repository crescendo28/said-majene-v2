'use client';

import { useState } from 'react';
import { saveConfig, createIndicator, initSync, processSyncItem, finishSync } from '@/app/actions';
import { 
  Search, Plus, RefreshCw, Loader2, Pencil, 
  BarChart2, Palette, TrendingUp, LayoutDashboard 
} from 'lucide-react';

interface AdminPanelProps {
  konfigData: any[];
  metadata: any[];
}

export default function AdminPanel({ konfigData = [], metadata = [] }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState('Aktif');
  const [formDesc, setFormDesc] = useState('');
  const [formChartType, setFormChartType] = useState('line');
  const [formColor, setFormColor] = useState('blue');
  const [formTrend, setFormTrend] = useState('UpIsGood');

  // Filter Data
  const safeData = Array.isArray(konfigData) ? konfigData : [];
  const filteredData = safeData.filter(row => 
    (row.Label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (row.Id || '').includes(searchTerm) ||
    (row.Kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(safeData.map((r: any) => r.Kategori).filter(Boolean)));

  // HANDLERS
  const openAddModal = () => {
    setModalMode('add');
    setFormId(''); setFormLabel(''); setFormCategory(''); setFormStatus('Aktif');
    setFormDesc(''); setFormChartType('line'); setFormColor('blue'); setFormTrend('UpIsGood');
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setModalMode('edit');
    setFormId(row.Id); 
    setFormLabel(row.Label); 
    setFormCategory(row.Kategori); 
    setFormStatus(row.Status);
    setFormDesc(row.Deskripsi || ''); 
    setFormChartType(row.TipeGrafik || 'line');
    setFormColor(row.Warna || 'blue'); 
    setFormTrend(row.TrendLogic || 'UpIsGood');
    setIsModalOpen(true);
  };

  const handleMetadataSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedMeta = metadata.find(m => m.var_id == selectedId);
    if (selectedMeta) {
        setFormId(selectedMeta.var_id);
        setFormLabel(selectedMeta['Nama Variabel'] || selectedMeta.Label || '');
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    try {
        if (modalMode === 'add') {
            await createIndicator(null, formData);
        } else {
            await saveConfig(formData);
        }
        setIsModalOpen(false);
    } catch (e) { console.error(e); alert("Terjadi kesalahan saat menyimpan."); }
    setIsSaving(false);
  };

  const startFullSync = async () => {
    if(!confirm("Mode Pemeliharaan: Full Sync akan menghapus dan mengambil ulang semua data. Lanjutkan?")) return;
    setIsSyncing(true); setProgress(0); setStatusText("Inisialisasi...");
    try {
        const init = await initSync();
        if(!init.success || !init.queue) throw new Error("Init fail");
        
        const queue = init.queue;
        const total = queue.length;
        
        if (total === 0) {
            setStatusText("Tidak ada antrian sinkronisasi.");
            setTimeout(() => setIsSyncing(false), 2000);
            return;
        }

        for (let i = 0; i < total; i++) {
            const item = (queue[i] as any);
            setStatusText(`Processing: ${item.id}...`);
            await processSyncItem(item.id);
            setProgress(Math.round(((i + 1) / total) * 100));
        }
        await finishSync();
        setStatusText("Selesai!");
        setTimeout(() => setIsSyncing(false), 2000);
    } catch (e) { 
        console.error(e);
        setStatusText("Gagal (Cek Console)");
        setTimeout(() => setIsSyncing(false), 3000); 
    }
  };

  const getColorClass = (color: string) => {
    const map: any = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500', orange: 'bg-orange-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500' };
    return map[color] || 'bg-gray-500';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold tracking-wide text-emerald-400">
            SAID Majene
        </div>
        <div className="p-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl text-white font-medium">
                <LayoutDashboard size={18} />
                <span>Dashboard Admin</span>
            </div>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
            <p className="text-xs text-slate-500">Versi 2.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 sticky top-0 z-20 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Manajemen Indikator</h2>
            <div className="text-sm text-slate-500">
                Total: <span className="font-bold text-slate-900">{filteredData.length}</span> Indikator
            </div>
        </header>

        <div className="p-8">
            
            {/* SYNC PROGRESS */}
            {isSyncing && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2 font-bold text-blue-800">
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin"/> {statusText}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            )}

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Cari ID, Label, atau Kategori..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={startFullSync} disabled={isSyncing} className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /> Full Sync
                    </button>
                    <button onClick={openAddModal} className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                        <Plus className="w-5 h-5" /> Tambah Baru
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="p-5 border-b">ID</th>
                                <th className="p-5 border-b">Label Variable</th>
                                <th className="p-5 border-b">Kategori</th>
                                <th className="p-5 border-b">Config Visual</th>
                                <th className="p-5 border-b">Status</th>
                                <th className="p-5 border-b text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row: any) => (
                                <tr key={row.Id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-5 font-mono text-slate-400 text-xs">{row.Id}</td>
                                    <td className="p-5">
                                        <div className="font-bold text-slate-800">{row.Label}</div>
                                        {row.Deskripsi && <div className="text-xs text-slate-400 truncate max-w-xs mt-1">{row.Deskripsi}</div>}
                                    </td>
                                    <td className="p-5">
                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 capitalize">
                                            {row.Kategori}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-500 capitalize">
                                                <BarChart2 size={12}/> {row.TipeGrafik || 'Line'}
                                            </span>
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-500 capitalize">
                                                <div className={`w-2 h-2 rounded-full ${getColorClass(row.Warna)}`}></div>
                                                {row.Warna || 'Blue'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            row.Status === 'Aktif' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {row.Status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button 
                                            onClick={() => openEditModal(row)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Edit Konfigurasi"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold text-slate-900">{modalMode === 'add' ? 'Tambah' : 'Edit'} Indikator</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            {/* Close Icon handled by UI interaction usually, using text X here */}
                            <span className="text-2xl font-light">&times;</span>
                        </button>
                    </div>
                    
                    <form action={handleSave} className="p-6 space-y-5">
                        
                        {/* ID & Source (Only for Add) */}
                        {modalMode === 'add' && metadata.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-xs font-bold uppercase mb-2 text-blue-800">Pilih dari Metadata (Opsional)</label>
                                <select onChange={handleMetadataSelect} className="w-full border-blue-200 p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">-- Manual Input --</option>
                                    {metadata.map((m:any)=><option key={m.var_id} value={m.var_id}>{m.var_id} - {m['Nama Variabel']}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Core Info */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold uppercase mb-1 text-slate-500">ID Variable</label>
                                <input name="id" value={formId} readOnly={modalMode==='edit'} onChange={e=>setFormId(e.target.value)} className={`w-full border p-2.5 rounded-lg text-sm font-mono ${modalMode==='edit' ? 'bg-slate-100 text-slate-500' : 'bg-white focus:ring-2 focus:ring-blue-500'} outline-none`} placeholder="Contoh: 101"/>
                             </div>
                             <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Kategori</label>
                                <input name="category" list="category-list" value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none capitalize" placeholder="Contoh: Ekonomi"/>
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Label Tampilan</label>
                            <input name="label" value={formLabel} onChange={e=>setFormLabel(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama indikator yang muncul di dashboard"/>
                        </div>

                        {/* Visual Config */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <LayoutDashboard size={14}/> Konfigurasi Visual
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-slate-500 flex items-center gap-1"><BarChart2 className="w-3 h-3"/> Grafik</label>
                                    <select name="chartType" value={formChartType} onChange={e=>setFormChartType(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white">
                                        <option value="line">Line (Tren)</option>
                                        <option value="bar">Bar (Batang)</option>
                                        <option value="doughnut">Doughnut</option>
                                        <option value="pie">Pie</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-slate-500 flex items-center gap-1"><Palette className="w-3 h-3"/> Warna</label>
                                    <select name="color" value={formColor} onChange={e=>setFormColor(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white">
                                        <option value="blue">Blue</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="rose">Rose</option>
                                        <option value="orange">Orange</option>
                                        <option value="purple">Purple</option>
                                        <option value="indigo">Indigo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1 text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Logika Tren</label>
                                <select name="trendLogic" value={formTrend} onChange={e=>setFormTrend(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white">
                                    <option value="UpIsGood">Naik = Bagus (Hijau)</option>
                                    <option value="DownIsGood">Turun = Bagus (Hijau)</option>
                                </select>
                            </div>
                        </div>

                        {/* Status & Desc */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Status</label>
                                <select name="status" value={formStatus} onChange={e=>setFormStatus(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white font-medium">
                                    <option value="Aktif">Aktif</option>
                                    <option value="Non-Aktif">Non-Aktif</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Deskripsi (Tooltip)</label>
                                <input name="description" value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none" placeholder="Info tambahan..."/>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                            <button type="submit" disabled={isSaving} className="flex-1 p-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : null} 
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        <datalist id="category-list">{categories.map((c:any)=><option key={c} value={c}/>)}</datalist>
      </main>
    </div>
  );
}