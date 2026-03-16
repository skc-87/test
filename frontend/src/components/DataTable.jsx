const DataTable = ({ title, data, columns, isLoading, emptyMessage }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-12 text-slate-400">
        <span className="inline-block h-8 w-8 rounded-full border-2 border-t-transparent border-indigo-500 animate-spin" />
        <p className="mt-3 text-sm">Loading {title?.toLowerCase() || "data"}...</p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        {typeof emptyMessage === "string" ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (emptyMessage)}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            {columns.map((column) => (
              <th key={column.key} className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${column.headerClass || ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr key={item._id || index} className="hover:bg-indigo-50/30 transition-colors">
              {columns.map((column) => (
                <td key={column.key} className={`px-5 py-3.5 text-slate-700 ${column.cellClass || ""}`}>
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;