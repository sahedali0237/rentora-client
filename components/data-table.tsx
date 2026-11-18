import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: Column[];
  data: T[];
  emptyMessage?: string;
  loading?: boolean;
  cellRenderer?: (key: string, value: unknown, row: T) => React.ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No records found.",
  loading = false,
  cellRenderer,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="px-4 py-3">
                <span className="font-medium text-gray-900 dark:text-white tracking-wider uppercase text-xs">
                  {col.label}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="border-b border-gray-100 dark:border-zinc-800/50 last:border-0"
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
                >
                  {cellRenderer
                    ? cellRenderer(col.key, row[col.key], row)
                    : String(row[col.key] ?? "-")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
export type { Column };
