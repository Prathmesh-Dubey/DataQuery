import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  AlertCircle,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  Loader2,
  UserRound,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import api, { ApiError } from "@/lib/api";
import logo from "@/assets/logo.png";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const { signInWithGoogle, signInAsGuest, signInWithPassword, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setVerifying(true);
    setError(null);
    try {
      await action();
      toast.success("Welcome back!");
      navigate("/chat", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Sign-in failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleCredential = (credential?: string) => {
    if (!credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }
    return run(() => signInWithGoogle(credential));
  };

  const handleGuest = () => run(() => signInAsGuest());

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      return run(() => signUp(name, email, password));
    }
    return run(() => signInWithPassword(email, password));
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await api.forgotPassword(email, resetPassword);
      toast.success("Password updated. Sign in with your new password.");
      setResetPassword("");
      setMode("signin");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not reset password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white px-4 dark:bg-black dark:from-black dark:via-black dark:to-black">
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-indigo-100/50 dark:border-white/10 dark:bg-neutral-950 dark:shadow-none">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logo}
              alt={t("appName")}
              className="mb-4 h-14 w-14 rounded-2xl object-cover"
            />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("appName")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
              {t("tagline")}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Database, label: t("featurePostgres") },
              { icon: Zap, label: t("featureGemini") },
              { icon: BarChart3, label: t("featureCharts") },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <Icon className="mx-auto mb-1 h-4 w-4 text-indigo-600 dark:text-white" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode !== "forgot" && (
            <>
              <div className="flex min-h-[44px] items-center justify-center">
                {verifying ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-white" />
                    {t("verifying")}
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={(res) => handleCredential(res.credential)}
                    onError={() => {
                      setError(
                        "Google sign-in was cancelled or failed. Check VITE_GOOGLE_CLIENT_ID."
                      );
                      toast.error("Google sign-in failed");
                    }}
                    theme="outline"
                    size="large"
                    width="340"
                    shape="pill"
                    text="signin_with"
                  />
                )}
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  {t("or")}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
            </>
          )}

          {mode === "forgot" ? (
            <form onSubmit={handleResetSubmit} className="space-y-2.5">
              <p className="mb-1 text-center text-[12px] leading-relaxed text-slate-500 dark:text-neutral-400">
                {t("resetPasswordHint")}
              </p>
              <input
                type="email"
                required
                placeholder={t("emailAddress")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verifying}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-0"
              />
              <div className="relative">
                <input
                  type={showResetPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder={t("newPassword")}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  disabled={verifying}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((s) => !s)}
                  tabIndex={-1}
                  title={showResetPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 dark:text-neutral-500 dark:hover:text-white"
                >
                  {showResetPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {t("sendResetLink")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                disabled={verifying}
                className="w-full text-center text-[12px] text-slate-500 underline-offset-2 transition hover:text-indigo-600 hover:underline disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
              >
                {t("backToSignIn")}
              </button>
            </form>
          ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder={t("fullName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={verifying}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-0"
              />
            )}
            <input
              type="email"
              required
              placeholder={t("emailAddress")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={verifying}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-0"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifying}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/40 dark:focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 dark:text-neutral-500 dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {mode === "signup" ? t("createAccount") : t("signIn")}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("forgot");
                }}
                disabled={verifying}
                className="w-full text-center text-[12px] text-slate-500 underline-offset-2 transition hover:text-indigo-600 hover:underline disabled:opacity-50 dark:text-neutral-500 dark:hover:text-white"
              >
                {t("forgotPassword")}
              </button>
            )}
          </form>
          )}

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
                disabled={verifying}
                className="mt-2 w-full text-center text-[12px] text-slate-500 underline-offset-2 transition hover:text-indigo-600 hover:underline disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
              >
                {mode === "signup" ? t("haveAccount") : t("newHere")}
              </button>

              <button
                onClick={handleGuest}
                disabled={verifying}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-white/15 dark:text-neutral-300 dark:hover:border-white/40 dark:hover:text-white"
              >
                <UserRound className="h-4 w-4" />
                {t("continueAsGuest")}
              </button>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400 dark:text-neutral-500">
                {t("guestHint")}
              </p>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400 dark:text-neutral-500">
                {t("footerNote1")}
                <br />
                {t("footerNote2")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
