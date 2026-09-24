import { useEffect, useState } from "react";
import { Check, Crown, Moon, Rocket, Sparkles, Sun, X, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { LANGUAGES, useLanguage, type Lang } from "@/context/LanguageContext";
import QueryHistoryPanel from "./QueryHistoryPanel";

type Tab = "general" | "history" | "upgrade";

interface Props {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onSetDark: (d: boolean) => void;
  isGuest?: boolean;
  initialTab?: Tab;
}

interface Plan {
  id: string;
  name: string;
  price: number | null; // null = free
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  popular?: boolean;
  features: Record<Lang, string[]>;
}

const PLANS: Plan[] = [
  {
    id: "lite",
    name: "Lite",
    price: null,
    icon: Sparkles,
    current: true,
    features: {
      en: ["50 queries / month", "1 saved conversation", "Community support"],
      hi: ["50 क्वेरी / माह", "1 सेव की गई बातचीत", "कम्युनिटी सपोर्ट"],
      mr: ["50 क्वेरी / महिना", "1 जतन केलेले संभाषण", "कम्युनिटी सपोर्ट"],
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 399,
    icon: Zap,
    popular: true,
    features: {
      en: [
        "Unlimited queries",
        "Full conversation history",
        "Priority Gemini responses",
        "CSV export",
        "Email support",
      ],
      hi: [
        "असीमित क्वेरी",
        "पूरा बातचीत इतिहास",
        "प्राथमिकता वाले Gemini जवाब",
        "CSV एक्सपोर्ट",
        "ईमेल सपोर्ट",
      ],
      mr: [
        "अमर्याद क्वेरी",
        "पूर्ण संभाषण इतिहास",
        "प्राधान्य Gemini उत्तरे",
        "CSV एक्सपोर्ट",
        "ईमेल सपोर्ट",
      ],
    },
  },
  {
    id: "max",
    name: "Max",
    price: 999,
    icon: Crown,
    features: {
      en: [
        "Everything in Pro",
        "Multiple data sources",
        "Team seats",
        "Priority support",
        "Custom SQL templates",
      ],
      hi: [
        "Pro की सभी सुविधाएं",
        "कई डेटा स्रोत",
        "टीम सीट्स",
        "प्राथमिकता सपोर्ट",
        "कस्टम SQL टेम्पलेट",
      ],
      mr: [
        "Pro मधील सर्व काही",
        "अनेक डेटा स्रोत",
        "टीम सीट्स",
        "प्राधान्य सपोर्ट",
        "सानुकूल SQL टेम्पलेट",
      ],
    },
  },
];

export default function SettingsPanel({
  open,
  onClose,
  dark,
  onSetDark,
  isGuest = false,
  initialTab,
}: Props) {
  const { lang, setLang, t } = useLanguage();
  const [tab, setTab] = useState<Tab>(initialTab ?? "general");
  const tabs: Tab[] = isGuest ? ["general", "upgrade"] : ["general", "history", "upgrade"];

  // Re-sync to the requested tab (e.g. the navbar's history shortcut)
  // each time the panel is opened, not just on first mount.
  useEffect(() => {
    if (open) setTab(initialTab ?? "general");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleUpgradeClick = () => toast(t("upgradeClickToast"), { icon: "🚧" });

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] dark:bg-black/70"
        onClick={onClose}
      />
      <aside className="fixed left-1/2 top-1/2 z-40 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("settings")}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-4 pt-2 dark:border-white/10">
          {tabs.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`rounded-t-lg px-3 py-2 text-[13px] font-medium transition ${
                tab === tb
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-white dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {tb === "general"
                ? t("settingsTabGeneral")
                : tb === "history"
                ? t("queryHistory")
                : t("settingsTabUpgrade")}
            </button>
          ))}
        </div>

        <div className="scroll-thin max-h-[70vh] overflow-y-auto p-4">
          {tab === "history" ? (
            <QueryHistoryPanel open onClose={() => {}} embedded />
          ) : tab === "general" ? (
            <>
              {/* Appearance */}
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  {t("appearance")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSetDark(false)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      !dark
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-white/40 dark:bg-white/10 dark:text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Sun className="h-4 w-4" /> {t("light")}
                  </button>
                  <button
                    onClick={() => onSetDark(true)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      dark
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-white/40 dark:bg-white/10 dark:text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Moon className="h-4 w-4" /> {t("dark")}
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  {t("language")}
                </p>
                <div className="space-y-1.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                        lang === l.code
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-white/40 dark:bg-white/10 dark:text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{l.native}</span>
                      {lang === l.code && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="grid gap-3 sm:grid-cols-3">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl border p-4 ${
                        plan.popular
                          ? "border-indigo-500 bg-indigo-50/50 dark:border-white/40 dark:bg-white/5"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-black">
                          {t("mostPopular")}
                        </span>
                      )}
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-indigo-600 dark:text-white" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{plan.name}</span>
                      </div>
                      <div className="mb-3">
                        {plan.price === null ? (
                          <span className="text-xl font-bold text-slate-900 dark:text-white">Free</span>
                        ) : (
                          <span className="text-xl font-bold text-slate-900 dark:text-white">
                            ₹{plan.price}
                            <span className="text-xs font-normal text-slate-400 dark:text-neutral-500">
                              {t("perMonth")}
                            </span>
                          </span>
                        )}
                      </div>
                      <ul className="mb-4 flex-1 space-y-1.5">
                        {plan.features[lang].map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-[12px] text-slate-600 dark:text-neutral-300"
                          >
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {plan.current ? (
                        <span className="rounded-xl border border-slate-200 px-3 py-2 text-center text-[13px] font-medium text-slate-500 dark:border-white/10 dark:text-neutral-400">
                          {t("currentPlan")}
                        </span>
                      ) : (
                        <button
                          onClick={handleUpgradeClick}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                        >
                          <Rocket className="h-3.5 w-3.5" /> {t("upgradeNow")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-neutral-500">
                {t("upgradeDemoNote")}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
