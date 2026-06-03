import type { ReactNode } from 'react';

type Column<Row> = {
  key: string;
  label: string;
  render: (row: Row) => ReactNode;
};

type ResponsiveTableProps<Row> = {
  columns: Column<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
};

export function ResponsiveTable<Row>({ columns, rows, getRowKey }: ResponsiveTableProps<Row>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-outline-variant bg-surface-container-low">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-outline-variant/50 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 align-top">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
        {rows.map((row) => (
          <article key={getRowKey(row)} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                    {column.label}
                  </span>
                  <div className="text-right text-sm text-on-surface">{column.render(row)}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
