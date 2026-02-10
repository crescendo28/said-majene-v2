'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveAnalysisAction, deleteAnalysisAction } from '@/app/actions';
import { 
  Plus, Pencil, Trash2, X, LayoutDashboard, Database, 
  Loader2, FileBarChart, ArrowLeft, LogOut
} from 'lucide-react';

interface AnalysisConfig {
  Id: string;
  Title: string;
  Category: string;
  Description: string;
  ChartType: string;
  SheetName: string;
  XAxisCol: string;
  YAxisCol: string;
  Status: string;
}

export default function AnalysisAdminPanel({ configs }: { configs: AnalysisConfig[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnalysisConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Form State
  const defaultForm = {
      Id: '', Title: '', Category: 'Umum', Description: '', 
      ChartType: 'line', SheetName: '', XAxisCol: '', YAxisCol: '', Status: 'Aktif'
  };
  const [formState, setFormState] = useState(defaultForm);

  const openAdd = () => {
      setEditingItem(null);
      setFormState({ ...defaultForm });
      setIsModalOpen(true);
  };

  const openEdit = (item: AnalysisConfig) => {
      setEditingItem(item);
      setFormState({ ...item });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Hapus analisis ini?")) return;
      await deleteAnalysisAction(id);
  };

  const handleSubmit = async (formData: FormData) => {
      setIsSaving(true);
      try {
          await saveAnalysisAction(formData);
          setIsModalOpen(false);
      } catch (e) {
          alert("Gagal menyimpan.");
      }
      setIsSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold tracking-wide text-emerald-400">
            SAID Majene
        </div>
        <div className="p-4 space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition font-medium">
                <LayoutDashboard size={18} />
                <span>Dashboard Admin</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl text-white font-medium">
                <FileBarChart size={18} />
                <span>Analysis Admin</span>
            </div>
        </div>
        <div className="mt-auto p-4 space-y-4 border-t border-slate-800">
            <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/30 transition font-medium"
            >
                {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
            <p className="text-xs text-slate-500 px-4">Versi 2.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800">
                    <ArrowLeft size={20}/>
                </Link>
                <h2 className="text-xl font-bold text-slate-800">Manajemen Analisis</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openAdd} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                  <Plus size={16}/> Tambah Baru
              </button>
            </div>
        </header>

        <div className="p-8">
            <div className="grid grid-cols-1 gap-4">
                {configs.map(item => (
                    <div key={item.Id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition-shadow">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.Status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    {item.Status}
                                </span>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">{item.Category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{item.Title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                    <LayoutDashboard size={12}/> {item.ChartType}
                                </span>
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
                                    <Database size={12}/> {item.SheetName}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(item)} className="p-2 bg-white border border-slate-200 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm">
                                <Pencil size={18}/>
                            </button>
                            <button onClick={() => handleDelete(item.Id)} className="p-2 bg-white border border-slate-200 text-rose-600 rounded-lg hover:bg-rose-50 transition shadow-sm">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
                {configs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">Belum ada data analisis.</p>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL */}
        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                       <h3 className="text-xl font-bold text-slate-900">{editingItem ? 'Edit' : 'Tambah'} Analisis</h3>
                       <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                           <X size={24} />
                       </button>
                   </div>
                   
                   <form action={handleSubmit} className="p-6 space-y-6">
                       <input type="hidden" name="id" value={formState.Id} />
                       
                       <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Judul</label>
                                   <input 
                                        required 
                                        name="title" 
                                        value={formState.Title} 
                                        onChange={e => setFormState({...formState, Title: e.target.value})} 
                                        className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 font-medium bg-white focus:ring-2 focus:ring-slate-900 outline-none" 
                                        placeholder="Judul Analisis" 
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kategori</label>
                                   <input 
                                        required 
                                        name="category" 
                                        value={formState.Category} 
                                        onChange={e => setFormState({...formState, Category: e.target.value})} 
                                        className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 font-medium bg-white focus:ring-2 focus:ring-slate-900 outline-none" 
                                        placeholder="Contoh: Pertanian" 
                                   />
                               </div>
                           </div>

                           <div>
                               <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Deskripsi / Analisis</label>
                               <textarea 
                                    required 
                                    name="description" 
                                    value={formState.Description} 
                                    onChange={e => setFormState({...formState, Description: e.target.value})} 
                                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 bg-white leading-relaxed h-32 focus:ring-2 focus:ring-slate-900 outline-none resize-none" 
                                    placeholder="Tuliskan narasi analisis di sini..." 
                               />
                           </div>

                           <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                               <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Database size={16}/> Sumber Data & Visualisasi
                               </h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="col-span-2">
                                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nama Sheet (Google Sheets)</label>
                                       <input 
                                            required 
                                            name="sheetName" 
                                            value={formState.SheetName} 
                                            onChange={e => setFormState({...formState, SheetName: e.target.value})} 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none" 
                                            placeholder="Sheet1" 
                                       />
                                       <p className="text-[10px] text-slate-500 mt-1 font-medium">⚠️ Pastikan nama sheet persis sama dengan di Google Spreadsheet.</p>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tipe Grafik</label>
                                       <select 
                                            name="chartType" 
                                            value={formState.ChartType} 
                                            onChange={e => setFormState({...formState, ChartType: e.target.value})} 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                                       >
                                           <option value="line">Line Chart</option>
                                           <option value="bar">Bar Chart</option>
                                           <option value="pie">Pie Chart</option>
                                           <option value="scatter">Scatter Plot</option>
                                       </select>
                                   </div>
                                   <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Status</label>
                                        <select 
                                            name="status" 
                                            value={formState.Status} 
                                            onChange={e => setFormState({...formState, Status: e.target.value})} 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                                        >
                                           <option value="Aktif">Aktif</option>
                                           <option value="Non-Aktif">Non-Aktif</option>
                                        </select>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kolom X-Axis (Label)</label>
                                       <input 
                                            required 
                                            name="xAxis" 
                                            value={formState.XAxisCol} 
                                            onChange={e => setFormState({...formState, XAxisCol: e.target.value})} 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none" 
                                            placeholder="Contoh: Tahun" 
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kolom Y-Axis (Nilai)</label>
                                       <input 
                                            required 
                                            name="yAxis" 
                                            value={formState.YAxisCol} 
                                            onChange={e => setFormState({...formState, YAxisCol: e.target.value})} 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900 outline-none" 
                                            placeholder="Contoh: Nilai" 
                                       />
                                   </div>
                               </div>
                           </div>
                       </div>

                       <div className="flex gap-3 pt-2 bg-slate-50 -mx-6 -mb-6 p-6 border-t border-slate-200">
                           <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition">Batal</button>
                           <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                               {isSaving && <Loader2 className="animate-spin" size={18}/>} Simpan Perubahan
                           </button>
                       </div>
                   </form>
               </div>
           </div>
        )}
      </main>
    </div>
  );
}