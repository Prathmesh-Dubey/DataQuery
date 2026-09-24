import { useEffect, useRef } from "react";
import { CornerDownLeft, Loader2, SendHorizonal } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  busy: boolean;
}

export default function ChatInput({ value, onChange, onSend, busy }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 dark:border-white/10 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/15 dark:bg-neutral-950 dark:focus-within:border-white/40 dark:focus-within:ring-white/10">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            disabled={busy}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("inputPlaceholder")}
            className="scroll-thin max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white dark:placeholder:text-neutral-500"
          />
          <button
            onClick={onSend}
            disabled={busy || !value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-neutral-500">
          <CornerDownLeft className="h-3 w-3" /> {t("inputFooter")}
        </p>
      </div>
    </div>
  );
}
