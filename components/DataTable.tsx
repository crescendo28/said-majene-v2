'use client';

export default function DataTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-medium">Data kosong</div>;
  }

  // Extract headers dynamically, ignoring hidden/internal columns like _rowNumber
  const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));

  return (
    <div className="w-full h-full">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm z-10">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-4 border-b border-slate-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
              {headers.map((h, colIndex) => (
                <td key={colIndex} className="p-4 text-slate-700">
                  {row[h] !== null && row[h] !== undefined ? String(row[h]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}