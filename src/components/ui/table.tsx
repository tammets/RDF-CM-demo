import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
};

export function Table({ containerClassName = "", className = "", children, ...props }: TableProps) {
  return (
    <div
      className={`relative w-full overflow-x-auto rounded-lg border border-slate-200 bg-white ${containerClassName}`}
    >
      <table
        {...props}
        className={`w-full border-collapse text-sm text-slate-700 ${className}`}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = "", children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...props} className={`bg-slate-100 text-slate-600 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ className = "", children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...props} className={`${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = "", children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={`border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = "", children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = "", children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={`px-4 py-3 align-top text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
