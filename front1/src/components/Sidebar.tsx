import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckSquare,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { relativeTime } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import logo from "@/assets/logo.png";
import type { Conversation, User } from "@/lib/api";

interface Props {
  user: User | null;
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  isGuest?: boolean;
  guestPromptsRemaining?: number;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export default function Sidebar({
  user,
  conversations,
  activeId,
  loading,
  isGuest = false,
  guestPromptsRemaining,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onBulkDelete,
  onLogout,
  onOpenSettings,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleSelecting = () => {
    setSelecting((s) => !s);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onBulkDelete(Array.from(selectedIds));
    setSelecting(false);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const commitRename = (id: string) => {
    const trimmed = draft.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-black">
      {/* Brand + profile */}
      <div className="border-b border-slate-200 p-3 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt={t("appName")}
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              {t("appName")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 md:hidden dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:bg-neutral-950 dark:border-white/10">
          {isGuest ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-white">
              <UserRound className="h-4 w-4" />
            </div>
          ) : user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-white/10 dark:text-white">
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">
              {isGuest ? t("guestBannerTitle") : user?.name ?? "Signed in"}
            </p>
            <p className="truncate text-[11px] text-slate-400 dark:text-neutral-400">
              {isGuest
                ? `${guestPromptsRemaining ?? 0} ${t("guestPromptsLeft")}`
                : user?.email}
            </p>
          </div>
          <button
            onClick={onLogout}
            title={t("signOut")}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isGuest && (
        <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t("guestBannerBody")}
        </div>
      )}

      {/* New chat */}
      {!isGuest && (
        <div className="p-3">
          <button
            onClick={onNew}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200 ${
              conversations.length === 0 ? "pulse-ring" : ""
            }`}
          >
            <Plus className="h-4 w-4" /> {t("newChat")}
          </button>
        </div>
      )}

      {/* Conversations */}
      {isGuest ? (
        <div className="flex-1" />
      ) : (
      <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
            {t("conversations")}
          </p>
          {conversations.length > 0 && (
            <button
              onClick={toggleSelecting}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              title={t("selectConversations")}
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {selecting && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-2 py-1.5 dark:bg-white/5">
            <span className="text-[11px] font-medium text-slate-600 dark:text-neutral-300">
              {selectedIds.size} {t("selected")}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={confirmBulkDelete}
                disabled={selectedIds.size === 0}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
              >
                {t("delete")}
              </button>
              <button
                onClick={toggleSelecting}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-2 px-2 py-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="shimmer h-9 rounded-lg bg-slate-100 dark:bg-neutral-900"
              />
            ))}
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
            {t("noConversations")}
            <br />
            {t("startOneAbove")}
          </p>
        )}
        <ul className="space-y-0.5">
          {conversations.map((c) => {
            const active = c.conversation_id === activeId;
            return (
              <li key={c.conversation_id} className="group relative">
                {editingId === c.conversation_id ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(c.conversation_id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded-md border border-indigo-300 bg-white px-2 py-1 text-[13px] text-slate-900 outline-none focus:border-indigo-500 dark:border-white/30 dark:bg-neutral-900 dark:text-white"
                    />
                    <button
                      onClick={() => commitRename(c.conversation_id)}
                      className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      selecting
                        ? toggleSelected(c.conversation_id)
                        : onSelect(c.conversation_id)
                    }
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                      active && !selecting
                        ? "bg-indigo-50 text-indigo-700 dark:bg-white/10 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {selecting ? (
                      selectedIds.has(c.conversation_id) ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-indigo-600 dark:text-white" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-slate-300" />
                      )
                    ) : (
                      <MessageSquare
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-indigo-600 dark:text-white" : "text-slate-300"
                        }`}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {c.title}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-neutral-500">
                        {relativeTime(c.last_message_at ?? c.updated_at ?? c.created_at)}
                      </span>
                    </span>
                    {!selecting && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(
                            menuFor === c.conversation_id ? null : c.conversation_id
                          );
                        }}
                        className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 group-hover:opacity-100 dark:hover:bg-white/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                )}

                {!selecting && menuFor === c.conversation_id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-9 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-950"
                  >
                    <button
                      onClick={() => {
                        setDraft(c.title);
                        setEditingId(c.conversation_id);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-white/10"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t("rename")}
                    </button>
                    <button
                      onClick={() => {
                        setMenuFor(null);
                        onDelete(c.conversation_id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 p-3 dark:border-white/10 space-y-0.5">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Settings className="h-4 w-4" /> {t("settings")}
        </button>
      </div>
    </aside>
  );
}
