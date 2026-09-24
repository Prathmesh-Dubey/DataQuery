import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Conversation } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  conversations,
  onSelect,
  onNew,
}: Props) {
  const [q, setQ] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const results = useMemo(
    () =>
      conversations.filter((c) =>
        c.title.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [conversations, q]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[12vh] dark:bg-black/70"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-white/10">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) {
                onSelect(results[0].conversation_id);
                onClose();
              }
            }}
            placeholder={t("switchConversation")}
            className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="scroll-thin max-h-72 overflow-y-auto p-2">
          <button
            onClick={() => {
              onNew();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-white/10"
          >
            <Plus className="h-4 w-4 text-indigo-600 dark:text-white" /> {t("newConversation")}
          </button>
          {results.map((c) => (
            <button
              key={c.conversation_id}
              onClick={() => {
                onSelect(c.conversation_id);
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-white/10"
            >
              <MessageSquare className="h-4 w-4 text-slate-300" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
          {results.length === 0 && q && (
            <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
              {t("noMatchingConversations")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
