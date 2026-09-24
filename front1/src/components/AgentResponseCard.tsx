import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardCopy,
  Clock,
  Rows3,
} from "lucide-react";
import SQLBlock from "./SQLBlock";
import ChartRenderer from "./ChartRenderer";
import DataTable from "./DataTable";
import { copyText, renderInline, toCSV } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import logo from "@/assets/logo.png";
import type { ChatResponse, Message } from "@/lib/api";

interface Props {
  message: Message;
  payload?: ChatResponse | null;
}

function Pill({
  icon,
  children,
  tone = "slate",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "slate" | "indigo" | "emerald";
}) {
  const tones = {
    slate:
      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-neutral-300",
    indigo:
      "bg-indigo-50 text-indigo-700 dark:bg-white/10 dark:text-white",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, li) => (
        <p key={li} className={li > 0 ? "mt-2" : undefined}>
          {renderInline(line).map((p, i) =>
            p.type === "b" ? (
              <strong key={i} className="font-semibold text-slate-900 dark:text-white">
                {p.v}
              </strong>
            ) : p.type === "c" ? (
              <code
                key={i}
                className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-white/10 dark:text-white"
              >
                {p.v}
              </code>
            ) : (
              <span key={i}>{p.v}</span>
            )
          )}
        </p>
      ))}
    </>
  );
}

export default function AgentResponseCard({ message, payload }: Props) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  if (message.message_type === "error") {
    return (
      <div className="animate-fade-up rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/40 dark:bg-red-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              {t("queryFailed")}
            </p>
            <p className="mt-1 text-sm text-red-600/90 dark:text-red-200/90">
              {message.content}
            </p>
          </div>
        </div>
        {message.sql_generated && (
          <div className="mt-3">
            <SQLBlock sql={message.sql_generated} />
          </div>
        )}
      </div>
    );
  }

  const sql = payload?.query.sql ?? message.sql_generated ?? null;
  const columns = payload?.result.columns ?? [];
  const rows = payload?.result.rows ?? [];
  const viz = payload?.visualization;

  const onCopyAll = async () => {
    const parts = [message.content];
    if (sql) parts.push("\n-- SQL --\n" + sql);
    if (columns.length) parts.push("\n-- DATA --\n" + toCSV(columns, rows));
    const ok = await copyText(parts.join("\n"));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="animate-fade-up group/card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-neutral-950">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-6 rounded-lg object-cover" />
          <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
            {t("generatedByGemini")}
          </span>
        </div>
        <button
          onClick={onCopyAll}
          title="Copy entire response"
          className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover/card:opacity-100 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <ClipboardCopy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 1. Natural language answer */}
      <div className="text-[15px] leading-relaxed text-slate-700 sm:text-base dark:text-neutral-200">
        <RichText text={message.content} />
      </div>

      {/* 2. SQL */}
      {sql && (
        <div className="mt-4">
          <SQLBlock sql={sql} />
        </div>
      )}

      {/* 3. Stats */}
      {payload && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill icon={<Rows3 className="h-3 w-3" />}>
            {payload.query.row_count} {t("rows")}
          </Pill>
          <Pill icon={<Clock className="h-3 w-3" />} tone="emerald">
            {payload.query.execution_time_ms} ms
          </Pill>
          {viz && (
            <Pill icon={<BarChart3 className="h-3 w-3" />} tone="indigo">
              {viz.chart_type}
            </Pill>
          )}
        </div>
      )}

      {/* 4. Visualization */}
      {payload && viz && viz.chart_type !== "table" && (
        <div className="mt-4">
          <ChartRenderer
            chartType={viz.chart_type}
            config={viz.config}
            columns={columns}
            rows={rows}
          />
        </div>
      )}

      {/* 5. Table */}
      {payload && columns.length > 0 && (
        <div className="mt-4">
          <DataTable columns={columns} rows={rows} />
        </div>
      )}
    </div>
  );
}
