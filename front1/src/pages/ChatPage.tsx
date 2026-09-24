import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  History,
  LogIn,
  Menu,
  Search,
  TrendingUp,
  Trophy,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import CommandPalette from "@/components/CommandPalette";
import SettingsPanel from "@/components/SettingsPanel";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import api, { ApiError } from "@/lib/api";
import type { ChatResponse, Conversation, Message } from "@/lib/api";
import logo from "@/assets/logo.png";

export default function ChatPage() {
  const { user, isGuest, guestPromptsRemaining, setGuestPromptsRemaining, signOut } =
    useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const EXAMPLES = [
    { icon: Trophy, text: t("exampleTop5") },
    { icon: Package, text: t("exampleAvgPrice") },
    { icon: TrendingUp, text: t("exampleTrend") },
    { icon: BarChart3, text: t("exampleTopCategory") },
  ];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(!isGuest);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payloads, setPayloads] = useState<Record<string, ChatResponse>>({});
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "history" | "upgrade">("general");
  const [dark, setDark] = useState(
    () => localStorage.getItem("dqa_theme") === "dark"
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("dqa_theme", dark ? "dark" : "light");
  }, [dark]);

  // Command palette shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!isGuest) setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGuest]);

  const loadConversations = useCallback(
    async (selectFirst = false) => {
      if (isGuest) return;
      setLoadingConvos(true);
      try {
        const res = await api.listConversations();
        setConversations(res.conversations);
        if (selectFirst && res.conversations.length > 0) {
          setActiveId((cur) => cur ?? res.conversations[0].conversation_id);
        }
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Could not load conversations"
        );
      } finally {
        setLoadingConvos(false);
      }
    },
    [isGuest]
  );

  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (isGuest || !activeId) {
      if (!isGuest) setMessages([]);
      return;
    }
    let cancelled = false;
    api
      .listMessages(activeId)
      .then((res) => {
        if (!cancelled) setMessages(res.messages);
      })
      .catch((err) => {
        if (!cancelled)
          toast.error(
            err instanceof ApiError ? err.message : "Could not load messages"
          );
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, isGuest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const handleNew = async () => {
    if (isGuest) {
      setMessages([]);
      setPayloads({});
      return null;
    }
    try {
      const conv = await api.createConversation("New Conversation");
      setConversations((cs) => [conv, ...cs]);
      setActiveId(conv.conversation_id);
      setMessages([]);
      setSidebarOpen(false);
      return conv;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start chat");
      return null;
    }
  };

  const handleRename = async (id: string, title: string) => {
    const prev = conversations;
    setConversations((cs) =>
      cs.map((c) => (c.conversation_id === id ? { ...c, title } : c))
    );
    try {
      await api.updateConversation(id, { title });
      toast.success("Renamed");
    } catch (err) {
      setConversations(prev);
      toast.error(err instanceof ApiError ? err.message : "Rename failed");
    }
  };

  const handleDelete = async (id: string) => {
    const prev = conversations;
    setConversations((cs) => cs.filter((c) => c.conversation_id !== id));
    if (activeId === id) setActiveId(null);
    try {
      await api.deleteConversation(id);
      toast.success("Conversation deleted");
    } catch (err) {
      setConversations(prev);
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const idSet = new Set(ids);
    setConversations((cs) => cs.filter((c) => !idSet.has(c.conversation_id)));
    if (activeId && idSet.has(activeId)) setActiveId(null);

    const results = await Promise.allSettled(ids.map((id) => api.deleteConversation(id)));
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      // Reconcile with the server rather than trusting optimistic state after partial failure.
      loadConversations();
      toast.error(
        failed === ids.length
          ? "Delete failed"
          : `${ids.length - failed} deleted, ${failed} failed`
      );
    } else {
      toast.success(`${ids.length} conversation${ids.length === 1 ? "" : "s"} deleted`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  const sendGuest = async (text: string) => {
    setInput("");
    setBusy(true);
    const optimistic: Message = {
      message_id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      message_type: "text",
      sql_generated: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.guestChat(text, history, lang);
      const isRefusal = res.query.sql === null;

      const assistant: Message = {
        message_id: res.assistant_message.message_id,
        role: "assistant",
        content: res.assistant_message.content,
        message_type: isRefusal ? "text" : "data_query",
        sql_generated: res.query.sql,
        created_at: new Date().toISOString(),
      };

      if (!isRefusal) {
        setPayloads((p) => ({ ...p, [assistant.message_id]: res }));
      }

      setMessages((m) => m.filter((msg) => msg.message_id !== optimistic.message_id).concat(
        { ...optimistic, message_id: res.user_message.message_id },
        assistant
      ));

      if (typeof res.guest_prompts_remaining === "number") {
        setGuestPromptsRemaining(res.guest_prompts_remaining);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong running that query";
      setMessages((m) => [
        ...m,
        {
          message_id: `err-${Date.now()}`,
          role: "assistant",
          content: msg,
          message_type: "error",
          sql_generated: null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (err instanceof ApiError && err.status === 403) {
        setGuestPromptsRemaining(0);
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    if (isGuest) {
      if (guestPromptsRemaining <= 0) {
        toast.error(`${t("guestLimitReached")} ${t("guestSignInToContinue")}`);
        return;
      }
      return sendGuest(text);
    }

    let convId = activeId;
    if (!convId) {
      const conv = await handleNew();
      if (!conv) return;
      convId = conv.conversation_id;
    }

    setInput("");
    setBusy(true);
    const optimistic: Message = {
      message_id: `tmp-${Date.now()}`,
      conversation_id: convId,
      role: "user",
      content: text,
      message_type: "text",
      sql_generated: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await api.chat(convId, text, lang);

      // REFUSE case: assistant replied with plain text, no SQL generated
      const isRefusal = res.query.sql === null;

      const assistant: Message = {
        message_id: res.assistant_message.message_id,
        conversation_id: convId,
        role: "assistant",
        content: res.assistant_message.content,
        message_type: isRefusal ? "text" : "data_query",
        sql_generated: res.query.sql,
        created_at: new Date().toISOString(),
      };

      // Only store payload for real data queries (so ChartMessage doesn't try to chart a refusal)
      if (!isRefusal) {
        setPayloads((p) => ({ ...p, [assistant.message_id]: res }));
      }

      setMessages((m) =>
        m
          .map((msg) =>
            msg.message_id === optimistic.message_id
              ? { ...msg, message_id: res.user_message.message_id }
              : msg
          )
          .concat(assistant)
      );
      loadConversations();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong running that query";
      setMessages((m) => [
        ...m,
        {
          message_id: `err-${Date.now()}`,
          conversation_id: convId!,
          role: "assistant",
          content: msg,
          message_type: "error",
          sql_generated: null,
          created_at: new Date().toISOString(),
        },
      ]);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const activeTitle = isGuest
    ? t("guestBannerTitle")
    : conversations.find((c) => c.conversation_id === activeId)?.title ??
      "New Conversation";

  const guestLimitReached = isGuest && guestPromptsRemaining <= 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-black">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex">
        <Sidebar
          user={user}
          conversations={conversations}
          activeId={activeId}
          loading={loadingConvos}
          isGuest={isGuest}
          guestPromptsRemaining={guestPromptsRemaining}
          onSelect={(id) => setActiveId(id)}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onLogout={handleLogout}
          onOpenSettings={() => {
            setSettingsTab("general");
            setSettingsOpen(true);
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Sidebar (mobile drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              user={user}
              conversations={conversations}
              activeId={activeId}
              loading={loadingConvos}
              isGuest={isGuest}
              guestPromptsRemaining={guestPromptsRemaining}
              onSelect={(id) => {
                setActiveId(id);
                setSidebarOpen(false);
              }}
              onNew={handleNew}
              onRename={handleRename}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onLogout={handleLogout}
              onOpenSettings={() => {
                setSidebarOpen(false);
                setSettingsTab("general");
                setSettingsOpen(true);
              }}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{activeTitle}</h2>
          </div>
          <div className="flex items-center gap-1">
            {!isGuest && (
              <button
                onClick={() => setPaletteOpen(true)}
                title="Search conversations (⌘K)"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-white/10"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
            {!isGuest && (
              <button
                onClick={() => {
                  setSettingsTab("history");
                  setSettingsOpen(true);
                }}
                title={t("queryHistory")}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-white/10"
              >
                <History className="h-4 w-4" />
              </button>
            )}
            {isGuest && (
              <button
                onClick={handleLogout}
                title={t("signIn")}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                <LogIn className="h-3.5 w-3.5" /> {t("signIn")}
              </button>
            )}
          </div>
        </header>

        <div className="scroll-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {messages.length === 0 && !busy && (
              <div className="flex flex-col items-center py-10 text-center sm:py-16">
                <img
                  src={logo}
                  alt={t("appName")}
                  className="mb-4 h-12 w-12 rounded-2xl object-cover"
                />
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  {t("askAnything")}
                </h1>
                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-neutral-400">
                  {t("askSubtitle")}
                </p>
                <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {EXAMPLES.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => setInput(text)}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[13px] text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-white" />
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <ChatMessage
                key={m.message_id}
                message={m}
                payload={payloads[m.message_id]}
                user={user}
              />
            ))}

            {busy && (
              <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
                  <img src={logo} alt="" className="h-3.5 w-3.5 animate-pulse rounded-sm object-cover" />
                  {t("thinking")}
                </div>
                <div className="space-y-2">
                  <div className="shimmer h-3 w-4/5 rounded bg-slate-200 dark:bg-neutral-800" />
                  <div className="shimmer h-3 w-3/5 rounded bg-slate-200 dark:bg-neutral-800" />
                  <div className="shimmer mt-4 h-28 rounded-xl bg-slate-100 dark:bg-neutral-900" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {guestLimitReached ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-black">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 text-center">
              <p className="text-sm text-slate-600 dark:text-neutral-300">
                {t("guestLimitReached")} {t("guestSignInToContinue")}
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                <LogIn className="h-4 w-4" /> {t("signIn")}
              </button>
            </div>
          </div>
        ) : (
          <ChatInput value={input} onChange={setInput} onSend={send} busy={busy} />
        )}
      </main>

      {!isGuest && (
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          conversations={conversations}
          onSelect={setActiveId}
          onNew={handleNew}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dark={dark}
        onSetDark={setDark}
        isGuest={isGuest}
        initialTab={settingsTab}
      />
    </div>
  );
}
