'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  saveConfig, 
  createIndicator, 
  deleteIndicatorAction, // Added this import
  initSync, 
  processSyncItem, 
  finishSync, 
  updateSettings 
} from '@/app/actions';
import { 
  Search, Plus, RefreshCw, Loader2, Pencil, Trash2, // Added Trash2
  BarChart2, Palette, TrendingUp, LayoutDashboard,
  Home, Target, Globe, FileText, List, Filter, Calendar,
  ArrowRightCircle, FileBarChart, LogOut
} from 'lucide-react';

interface AdminPanelProps {
  konfigData: any[];
  metadata: any[];
  settings: Record<string, string>;
}

export default function AdminPanel({ konfigData = [], metadata = [], settings = {} }: AdminPanelProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [pubLink, setPubLink] = useState(settings['publication_link'] || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Added deleting state
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState('Aktif');
  const [formDesc, setFormDesc] = useState('');
  const [formChartType, setFormChartType] = useState('line');
  const [formColor, setFormColor] = useState('blue');
  const [formTrend, setFormTrend] = useState('UpIsGood');
  const [formShowHome, setFormShowHome] = useState(false);
  const [formTargetRPJMD, setFormTargetRPJMD] = useState('');
  const [formDataFilter, setFormDataFilter] = useState('');
  const [formFilterTahun, setFormFilterTahun] = useState('');
  const [idSuggestions, setIdSuggestions] = useState<any[]>([]);
  const [showIdSuggestions, setShowIdSuggestions] = useState(false);

  const safeData = Array.isArray(konfigData) ? konfigData : [];
  const filteredData = safeData.filter(row => 
    (row.Label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (row.Id || '').includes(searchTerm) ||
    (row.Kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categories = Array.from(new Set(safeData.map((r: any) => r.Kategori).filter(Boolean)));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormId(''); setFormLabel(''); setFormCategory(''); setFormStatus('Aktif');
    setFormDesc(''); setFormChartType('line'); setFormColor('blue'); setFormTrend('UpIsGood');
    setFormShowHome(false); setFormTargetRPJMD(''); setFormDataFilter(''); setFormFilterTahun('');
    setIdSuggestions([]); setShowIdSuggestions(false);
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setModalMode('edit');
    setFormId(row.Id); setFormLabel(row.Label); setFormCategory(row.Kategori); setFormStatus(row.Status);
    setFormDesc(row.Deskripsi || ''); setFormChartType(row.TipeGrafik || 'line');
    setFormColor(row.Warna || 'blue'); setFormTrend(row.TrendLogic || 'UpIsGood');
    setFormShowHome(row.ShowOnHome); setFormTargetRPJMD(row.TargetRPJMD || '');
    setFormDataFilter(row.DataFilter || ''); setFormFilterTahun(row.FilterTahun || '');
    setShowIdSuggestions(false);
    setIsModalOpen(true);
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormId(val);
    if (val.length > 1 && modalMode === 'add') {
        const matches = metadata.filter((m: any) => {
            const id = String(m.var_id || m.id_variable || m.Id || '').toLowerCase();
            const label = String(m['Nama Variabel'] || m.label || m.Label || '').toLowerCase();
            const search = val.toLowerCase();
            return id.includes(search) || label.includes(search);
        }).slice(0, 10);
        setIdSuggestions(matches);
        setShowIdSuggestions(true);
    } else {
        setShowIdSuggestions(false);
    }
  };

  const selectSuggestion = (item: any) => {
    setFormId(item.var_id || item.id_variable || item.Id);
    setFormLabel(item['Nama Variabel'] || item.label || item.Label);
    if (item.kategori || item.Category) setFormCategory(item.kategori || item.Category);
    setShowIdSuggestions(false);
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    try {
        if (modalMode === 'add') { await createIndicator(null, formData); } else { await saveConfig(formData); }
        setIsModalOpen(false);
    } catch (e) { console.error(e); alert("Terjadi kesalahan saat menyimpan."); }
    setIsSaving(false);
  };

  const handleSettingsSave = async (formData: FormData) => {
      setIsSavingSettings(true);
      await updateSettings(formData);
      setIsSavingSettings(false);
      alert("Pengaturan berhasil disimpan.");
  };

  const handleSingleSync = async (id: string) => {
      if(!confirm(`Update data untuk ID ${id}?`)) return;
      setSyncingId(id);
      try {
          const res = await processSyncItem(id);
          if (res.success) { await finishSync(); alert(`Data untuk ${id} berhasil diperbarui.`); } else { alert(`Gagal memperbarui data: ${res.error}`); }
      } catch (e) { console.error(e); alert("Terjadi kesalahan jaringan."); }
      setSyncingId(null);
  };

  // --- NEW DELETE FUNCTION ---
  const handleDelete = async (id: string, label: string) => {
      if(!confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus indikator "${label}" (${id})?\n\nIndikator ini akan dihapus dari sistem.`)) return;
      
      setDeletingId(id);
      try {
          const res = await deleteIndicatorAction(id);
          if (res.success) { 
              // Using a subtle toast/alert here is good
          } else { 
              alert(`Gagal menghapus data: ${res.error}`); 
          }
      } catch (e) { 
          console.error(e); 
          alert("Terjadi kesalahan jaringan."); 
      }
      setDeletingId(null);
  };

  const startFullSync = async () => {
    if(!confirm("Mode Pemeliharaan: Full Sync akan menghapus dan mengambil ulang semua data. Lanjutkan?")) return;
    setIsSyncing(true); setProgress(0); setStatusText("Inisialisasi...");
    try {
        const init = await initSync();
        if(!init.success || !init.queue) throw new Error("Init fail");
        const queue = init.queue; const total = queue.length;
        if (total === 0) { setStatusText("Tidak ada antrian sinkronisasi."); setTimeout(() => setIsSyncing(false), 2000); return; }
        for (let i = 0; i < total; i++) {
            const item = (queue[i] as any);
            setStatusText(`Processing: ${item.id}...`);
            await processSyncItem(item.id);
            setProgress(Math.round(((i + 1) / total) * 100));
        }
        await finishSync(); setStatusText("Selesai!"); setTimeout(() => setIsSyncing(false), 2000);
    } catch (e) { console.error(e); setStatusText("Gagal (Cek Console)"); setTimeout(() => setIsSyncing(false), 3000); }
  };

  const getColorClass = (color: string) => {
    const map: any = { blue: 'bg-blue-50', emerald: 'bg-emerald-500', rose: 'bg-rose-500', orange: 'bg-orange-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500' };
    return map[color] || 'bg-gray-500';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold tracking-wide text-emerald-400">SAID Majene</div>
        <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl text-white font-medium">
                <LayoutDashboard size={18} /><span>Dashboard Admin</span>
            </div>
            <Link href="/admin/analysis" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition font-medium">
                <FileBarChart size={18} /><span>Analysis Admin</span>
            </Link>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition font-medium text-sm">
                <LogOut size={18} /><span>Keluar</span>
             </button>
             <p className="text-[10px] text-slate-600 text-center mt-2">Versi 2.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 sticky top-0 z-20 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Manajemen Indikator</h2>
            <div className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900">{filteredData.length}</span> Indikator</div>
        </header>

        <div className="p-8 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2"><Globe size={16}/> Pengaturan Publik</h3>
                <form action={handleSettingsSave} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold mb-1 text-slate-800">Link "Unduh Publikasi"</label>
                        <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-slate-50">
                            <FileText size={16} className="text-slate-400"/><input name="publicationLink" value={pubLink} onChange={(e) => setPubLink(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" placeholder="https://majene.bps.go.id/..." />
                        </div>
                    </div>
                    <button type="submit" disabled={isSavingSettings} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">{isSavingSettings ? 'Menyimpan...' : 'Update Link'}</button>
                </form>
            </div>

            {isSyncing && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2 font-bold text-blue-800"><span className="flex items-center gap-2"><Loader2 className="animate-spin"/> {statusText}</span><span>{progress}%</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div></div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" /><input type="text" placeholder="Cari ID, Label, atau Kategori..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={startFullSync} disabled={isSyncing} className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /> Full Sync</button>
                    <button onClick={openAddModal} className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"><Plus className="w-5 h-5" /> Tambah Baru</button>
                </div>
            </div>

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
                                        <div className="flex items-center gap-2">{row.ShowOnHome && (<span title="Ditampilkan di Beranda"><Home size={12} className="text-emerald-500" /></span>)}<div className="font-bold text-slate-800">{row.Label}</div></div>
                                        {row.TargetRPJMD && <div className="text-xs text-indigo-500 mt-1 font-medium">Target: {row.TargetRPJMD}</div>}
                                        {row.DataFilter && <div className="text-[10px] text-slate-400 mt-0.5">Filter Cat: {row.DataFilter}</div>}
                                        {row.FilterTahun && <div className="text-[10px] text-orange-400 mt-0.5">Filter Tahun: {row.FilterTahun}</div>}
                                    </td>
                                    <td className="p-5"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 capitalize">{row.Kategori}</span></td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-500 capitalize"><BarChart2 size={12}/> {row.TipeGrafik || 'Line'}</span>
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-500 capitalize"><div className={`w-2 h-2 rounded-full ${getColorClass(row.Warna)}`}></div>{row.Warna || 'Blue'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${row.Status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{row.Status}</span></td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleSingleSync(row.Id)} disabled={syncingId === row.Id} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50" title="Sync Data dari BPS">{syncingId === row.Id ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16} />}</button>
                                            <button onClick={() => openEditModal(row)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit Konfigurasi"><Pencil size={16} /></button>
                                            
                                            {/* DELETE BUTTON ADDED HERE */}
                                            <button onClick={() => handleDelete(row.Id, row.Label)} disabled={deletingId === row.Id} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50" title="Hapus Indikator">
                                              {deletingId === row.Id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400">Tidak ada data ditemukan.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold text-slate-900">{modalMode === 'add' ? 'Tambah' : 'Edit'} Indikator</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="text-2xl font-light">&times;</span></button>
                    </div>
                    <form action={handleSave} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-xs font-bold uppercase mb-1 text-slate-500">ID Variable / Cari Metadata</label>
                                    <div className="relative">
                                        <input name="id" value={formId} readOnly={modalMode==='edit'} onChange={handleIdChange} onFocus={() => modalMode === 'add' && formId.length > 0 && setShowIdSuggestions(true)} className={`w-full border p-2.5 rounded-lg text-sm font-mono ${modalMode==='edit' ? 'bg-slate-100 text-slate-500' : 'bg-white focus:ring-2 focus:ring-blue-500'} outline-none`} placeholder="Ketik ID atau Nama..." autoComplete="off" />
                                        {modalMode === 'add' && (<div className="absolute right-3 top-2.5 text-slate-400"><Search size={14} /></div>)}
                                    </div>
                                    {showIdSuggestions && modalMode === 'add' && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                            {idSuggestions.length > 0 ? (idSuggestions.map((item, idx) => (
                                                    <div key={idx} onClick={() => selectSuggestion(item)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                                                        <div className="flex justify-between items-baseline mb-0.5"><span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 px-1.5 rounded">{item.var_id || item.id_variable || item.Id}</span></div>
                                                        <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item['Nama Variabel'] || item.label || item.Label}</div>
                                                    </div>
                                                ))) : (<div className="p-4 text-xs text-slate-400 text-center">Tidak ada data metadata yang cocok.</div>)}
                                        </div>
                                    )}
                                </div>
                                <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Label Tampilan</label><input name="label" value={formLabel} onChange={e=>setFormLabel(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Label Indikator"/></div>
                                <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Kategori</label><input name="category" list="category-list" value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none capitalize" placeholder="Contoh: Ekonomi"/></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 items-center gap-1"><Filter size={12}/> Filter Kategori</label><input name="dataFilter" value={formDataFilter} onChange={e=>setFormDataFilter(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Contoh: !Total" title="Gunakan '!' di depan untuk EXCLUDE (misal: '!Total' untuk pie chart)"/><p className="text-[9px] text-slate-400 mt-1">Tips: Gunakan <b>!Nama</b> untuk exclude</p></div>
                                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 items-center gap-1"><Calendar size={12}/> Filter Tahun</label><input name="filterTahun" value={formFilterTahun} onChange={e=>setFormFilterTahun(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 2024" title="Filter baris data berdasarkan Tahun. Gunakan untuk Pie Chart."/></div>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><LayoutDashboard size={14}/> Konfigurasi Visual</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Grafik</label><select name="chartType" value={formChartType} onChange={e=>setFormChartType(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white"><option value="line">Line</option><option value="bar">Bar</option><option value="doughnut">Doughnut</option><option value="pie">Pie</option></select></div>
                                        <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Warna</label><select name="color" value={formColor} onChange={e=>setFormColor(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white"><option value="blue">Blue</option><option value="emerald">Emerald</option><option value="rose">Rose</option><option value="orange">Orange</option><option value="purple">Purple</option><option value="indigo">Indigo</option></select></div>
                                    </div>
                                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Logika Tren</label><select name="trendLogic" value={formTrend} onChange={e=>setFormTrend(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white"><option value="UpIsGood">Naik = Bagus (Hijau)</option><option value="DownIsGood">Turun = Bagus (Hijau)</option></select></div>
                                </div>
                             </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                             <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-4"><Home size={14}/> Pengaturan Beranda & RPJMD</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="showOnHome" checked={formShowHome} onChange={e => setFormShowHome(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"/><span className="text-sm font-bold text-indigo-900">Tampilkan di Beranda</span></label>
                                <div><label className="block text-xs font-bold uppercase mb-1 text-indigo-800 items-center gap-1"><Target size={12}/> Target RPJMD</label><input name="targetRPJMD" value={formTargetRPJMD} onChange={e=>setFormTargetRPJMD(e.target.value)} className="w-full border border-indigo-200 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: 5.25%"/></div>
                             </div>
                        </div>

                        <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Deskripsi (Tooltip)</label><input name="description" value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none" placeholder="Info tambahan..."/></div>
                        
                        <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500">Status</label><select name="status" value={formStatus} onChange={e=>setFormStatus(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white font-medium"><option value="Aktif">Aktif</option><option value="Non-Aktif">Non-Aktif</option></select></div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                            <button type="submit" disabled={isSaving} className="flex-1 p-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={18}/> : null} {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
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