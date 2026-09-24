import React from 'react';

const DataTable = ({ columns, data, emptyMessage = 'No records found.' }) => (
  <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-soft">
    <table className="min-w-full divide-y divide-ink-100 text-sm">
      <thead className="bg-ink-50/60">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-ink-500">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-50">
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-400">
              {emptyMessage}
            </td>
          </tr>
        )}
        {data.map((row, i) => (
          <tr key={row._id || i} className="hover:bg-ink-50/50">
            {columns.map((col) => (
              <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink-700">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;
