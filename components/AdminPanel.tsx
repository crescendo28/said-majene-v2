'use client';

import { useState } from 'react';
import { saveConfig, createIndicator, initSync, processSyncItem, finishSync } from '@/app/actions';
import { Search, Plus, Save, RefreshCw, X, Loader2, Database, Pencil, FileText, Palette, TrendingUp, BarChart2 } from 'lucide-react';

interface AdminPanelProps {
  konfigData: any[];
  metadata: any[];
}

export default function AdminPanel({ konfigData, metadata }: AdminPanelProps) {
  // ... (Keep existing State logic) ...
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
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
  const filteredData = konfigData.filter(row => 
    row.Label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.Id?.includes(searchTerm) ||
    row.Kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(konfigData.map((r: any) => r.Kategori).filter(Boolean)));

  // HANDLERS
  const openAddModal = () => {
    setModalMode('add');
    setFormId(''); setFormLabel(''); setFormCategory(''); setFormStatus('Aktif');
    setFormDesc(''); setFormChartType('line'); setFormColor('blue'); setFormTrend('UpIsGood');
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setModalMode('edit');
    setFormId(row.Id); setFormLabel(row.Label); setFormCategory(row.Kategori); setFormStatus(row.Status);
    setFormDesc(row.Deskripsi || ''); setFormChartType(row.TipeGrafik || 'line');
    setFormColor(row.Warna || 'blue'); setFormTrend(row.TrendLogic || 'UpIsGood');
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
            const id = formData.get('id') as string;
            await processSyncItem(id);
            await finishSync();
        } else {
            await saveConfig(formData);
        }
        setIsModalOpen(false);
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  // ... (Keep existing Sync logic) ...
  const startFullSync = async () => {
    if(!confirm("Mode Pemeliharaan: Full Sync akan menghapus dan mengambil ulang semua data. Lanjutkan?")) return;
    setIsSyncing(true); setProgress(0); setLogs([]); setStatusText("Inisialisasi...");
    try {
        const init = await initSync();
        if(!init.success || !init.queue) throw new Error("Init fail");
        const queue = init.queue;
        const total = queue.length;
        setLogs(prev => [`Found ${total} vars.`, ...prev]);
        for (let i = 0; i < total; i++) {
            const item = queue[i];
            setStatusText(`Processing: ${item.label.substring(0, 20)}...`);
            const res = await processSyncItem(item.id);
            setLogs(prev => [res.success ? `✅ ${item.id} OK` : `❌ ${item.id} Fail`, ...prev]);
            setProgress(Math.round(((i + 1) / total) * 100));
        }
        await finishSync();
        setStatusText("Selesai!");
        setTimeout(() => setIsSyncing(false), 2000);
    } catch (e) { setIsSyncing(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold tracking-wide">Admin SAID</div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 sticky top-0 z-20">
            <h2 className="text-xl font-bold text-slate-800">Manajemen Data</h2>
        </header>

        <div className="p-8">
            {/* ... Sync Progress & Toolbar ... */}
            {isSyncing && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow border border-blue-100">
                    <div className="flex justify-between items-center mb-2 font-bold text-blue-800">
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin"/> {statusText}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${progress}%`}}></div></div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div className="relative w-96">
                    <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 shadow-sm" />
                </div>
                <div className="flex gap-3">
                    <button onClick={startFullSync} disabled={isSyncing} className="px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 bg-slate-200 text-slate-600 hover:bg-slate-300">
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'hidden' : ''}`} /> Full Sync
                    </button>
                    <button onClick={openAddModal} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Tambah Baru
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                        <tr>
                            <th className="p-5 border-b">ID</th>
                            <th className="p-5 border-b">Label</th>
                            <th className="p-5 border-b">Kategori</th>
                            <th className="p-5 border-b">Tipe</th>
                            <th className="p-5 border-b">Status</th>
                            <th className="p-5 border-b text-right">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((row: any) => (
                            <tr key={row.Id} className="hover:bg-slate-50">
                                <td className="p-5 font-mono text-slate-400">{row.Id}</td>
                                <td className="p-5 font-bold">{row.Label}</td>
                                <td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{row.Kategori}</span></td>
                                <td className="p-5 text-xs text-slate-500 uppercase">{row.TipeGrafik || 'Line'}</td>
                                <td className="p-5"><span className={`px-2 py-1 rounded text-xs font-bold ${row.Status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>{row.Status}</span></td>
                                <td className="p-5 text-right"><button onClick={() => openEditModal(row)}><Pencil className="w-4 h-4 text-blue-600" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold mb-6 text-slate-900">{modalMode === 'add' ? 'Tambah' : 'Edit'} Indikator</h3>
                    
                    <form action={handleSave} className="space-y-4">
                        {modalMode === 'add' && (
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Cari Metadata</label>
                                <select onChange={handleMetadataSelect} className="w-full border p-2 rounded-lg text-sm"><option value="">-- Pilih --</option>{metadata.map((m:any)=><option key={m.var_id} value={m.var_id}>{m.var_id} - {m['Nama Variabel']}</option>)}</select>
                            </div>
                        )}
                        <input name="id" value={formId} readOnly={modalMode==='edit'} onChange={e=>setFormId(e.target.value)} className="w-full border p-2 rounded-lg bg-slate-50 text-sm" placeholder="ID Variable"/>
                        <input name="label" value={formLabel} onChange={e=>setFormLabel(e.target.value)} className="w-full border p-2 rounded-lg text-sm" placeholder="Label Tampilan"/>
                        <input name="category" list="category-list" value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full border p-2 rounded-lg text-sm" placeholder="Kategori"/>
                        
                        {/* Visual Config */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1 flex items-center gap-1"><BarChart2 className="w-3 h-3"/> Tipe Grafik</label>
                                <select name="chartType" value={formChartType} onChange={e=>setFormChartType(e.target.value)} className="w-full border p-2 rounded-lg text-sm">
                                    <option value="line">Line (Tren)</option>
                                    <option value="bar">Bar (Batang)</option>
                                    <option value="doughnut">Doughnut</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1 flex items-center gap-1"><Palette className="w-3 h-3"/> Warna Tema</label>
                                <select name="color" value={formColor} onChange={e=>setFormColor(e.target.value)} className="w-full border p-2 rounded-lg text-sm">
                                    <option value="blue">Blue</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="rose">Rose</option>
                                    <option value="orange">Orange</option>
                                    <option value="purple">Purple</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Logika Tren</label>
                            <select name="trendLogic" value={formTrend} onChange={e=>setFormTrend(e.target.value)} className="w-full border p-2 rounded-lg text-sm">
                                <option value="UpIsGood">Naik = Bagus (Hijau)</option>
                                <option value="DownIsGood">Turun = Bagus (Hijau)</option>
                            </select>
                        </div>

                        <textarea name="description" value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full border p-2 rounded-lg text-sm h-20" placeholder="Deskripsi..."></textarea>
                        
                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={()=>setIsModalOpen(false)} className="w-1/2 p-3 bg-slate-100 rounded-xl font-bold">Batal</button>
                            <button type="submit" disabled={isSaving} className="w-1/2 p-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600">{isSaving?'Saving...':'Simpan'}</button>
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