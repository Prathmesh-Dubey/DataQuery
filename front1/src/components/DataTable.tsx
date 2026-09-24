import { useState } from "react";
import { Check, Download, TableIcon } from "lucide-react";
import { copyText, formatCell, toCSV } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
  maxHeight?: number;
}

export default function DataTable({ columns, rows, maxHeight = 340 }: Props) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const onCopyCsv = async () => {
    const ok = await copyText(toCSV(columns, rows));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  if (!columns.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-neutral-300">
          <TableIcon className="h-3.5 w-3.5" />
          {t("resultSet")} · {rows.length} {rows.length === 1 ? t("row") : t("rows")}
        </div>
        <button
          onClick={onCopyCsv}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {copied ? t("copiedCsv") : t("copyCsv")}
        </button>
      </div>
      <div
        className="scroll-thin overflow-auto"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-black/95 dark:text-neutral-400"
                >
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 dark:odd:bg-black dark:even:bg-white/[0.03] dark:hover:bg-white/10"
              >
                {columns.map((c) => (
                  <td
                    key={c}
                    className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600 tabular-nums dark:border-white/10 dark:text-neutral-300"
                  >
                    {formatCell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-sm text-slate-400 dark:text-neutral-500"
                >
                  {t("noRowsReturned")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
