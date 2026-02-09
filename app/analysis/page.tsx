export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl bg-slate-900 p-10 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Advanced Analysis</h1>
        <p className="text-slate-400 text-lg mb-8">
          Quadrant Analysis and specialized statistical tools are currently under development.
        </p>
        
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-500">
          Module: <span className="text-indigo-400 font-mono">analysis/v1</span> • Status: <span className="text-yellow-500 font-mono">Building</span>
        </div>
      </div>
    </main>
  );
}