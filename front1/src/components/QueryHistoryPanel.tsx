import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, X } from "lucide-react";
import api, { ApiError } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import SQLBlock from "./SQLBlock";
import DataTable from "./DataTable";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import type { QueryDetail, QueryExecution } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Render as inline tab content (no overlay/backdrop/close button) instead of a slide-in panel. */
  embedded?: boolean;
}

const statusTone: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  BLOCKED: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  TIMEOUT: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-neutral-300",
};

export default function QueryHistoryPanel({ open, onClose, embedded = false }: Props) {
  const [queries, setQueries] = useState<QueryExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<QueryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { t } = useLanguage();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listQueries();
      setQueries(res.queries);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setDetail(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await api.getQuery(id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load query");
    } finally {
      setDetailLoading(false);
    }
  };

  if (!open) return null;

  const data = detail?.result?.result_data as
    | { columns?: string[]; rows?: Record<string, unknown>[] }
    | undefined;

  const header = (
    <div
      className={
        embedded
          ? "mb-3 flex items-center justify-between"
          : "flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10"
      }
    >
      <div className="flex items-center gap-2">
        {detail && (
          <button
            onClick={() => setDetail(null)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {!embedded && (
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {detail ? t("queryDetail") : t("queryHistory")}
          </h3>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!detail && (
          <button
            onClick={load}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
        {!embedded && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const body = (
    <>
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="shimmer h-20 rounded-xl bg-slate-100 dark:bg-neutral-900"
                />
              ))}
            </div>
          )}

          {!loading && !detail && queries.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-neutral-500">
              {t("noQueriesYet")}
            </p>
          )}

          {!detail &&
            !loading &&
            queries.map((q) => (
              <button
                key={q.query_id}
                onClick={() => openDetail(q.query_id)}
                className="mb-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:hover:border-white/30"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      statusTone[q.execution_status] ?? statusTone.TIMEOUT
                    }`}
                  >
                    {q.execution_status}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                    {relativeTime(q.created_at)}
                  </span>
                </div>
                <p className="line-clamp-2 font-mono text-[11.5px] leading-relaxed text-slate-500 dark:text-neutral-400">
                  {q.generated_sql}
                </p>
                <div className="mt-2 flex gap-3 text-[11px] text-slate-400 dark:text-neutral-500">
                  <span>{q.row_count ?? 0} {t("rows")}</span>
                  <span>{q.execution_time_ms ?? "—"} ms</span>
                </div>
              </button>
            ))}

          {detailLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-white" />
            </div>
          )}

          {detail && !detailLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    statusTone[detail.execution_status] ?? statusTone.TIMEOUT
                  }`}
                >
                  {detail.execution_status}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                  {detail.row_count ?? 0} {t("rows")} · {detail.execution_time_ms ?? "—"} ms ·{" "}
                  {relativeTime(detail.created_at)}
                </span>
              </div>
              <SQLBlock sql={detail.generated_sql} defaultOpen />
              {detail.error_message && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                  {detail.error_message}
                </p>
              )}
              {data?.columns && data?.rows && (
                <DataTable
                  columns={data.columns}
                  rows={data.rows}
                  maxHeight={280}
                />
              )}
            </div>
          )}
    </>
  );

  if (embedded) {
    return (
      <div>
        {header}
        {body}
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] lg:hidden dark:bg-black/70"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl lg:static lg:z-0 lg:w-[380px] lg:shadow-none dark:border-white/10 dark:bg-black">
        {header}
        <div className="scroll-thin flex-1 overflow-y-auto p-3">{body}</div>
      </aside>
    </>
  );
}
