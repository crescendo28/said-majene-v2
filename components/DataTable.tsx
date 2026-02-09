'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface DataTableProps {
  data: any[];
  headers: string[];
}

export default function DataTable({ data, headers }: DataTableProps) {
  // SAFETY CHECK: If data is undefined/null, force it to be an empty array []
  const safeData = Array.isArray(data) ? data : [];
  const safeHeaders = Array.isArray(headers) ? headers : [];
  
  const [searchTerm, setSearchTerm] = useState('');

  // Now .filter() will always work because safeData is guaranteed to be an array
  const filteredData = safeData.filter((row) =>
    Object.values(row).some((value: any) =>
      String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
            <tr>
              {safeHeaders.map((header) => (
                <th key={header} className="px-6 py-4 font-semibold border-b border-slate-800">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                {safeHeaders.map((header) => (
                  <td key={`${index}-${header}`} className="px-6 py-4 text-slate-300 whitespace-nowrap">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          {safeData.length === 0 ? "No data found." : "No matching results."}
        </div>
      )}
    </div>
  );
}