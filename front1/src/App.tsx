import { useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import LoginPage from "@/pages/LoginPage";
import ChatPage from "@/pages/ChatPage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { getToken } from "@/lib/api";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const [token, setTokenState] = useState<string | null>(getToken());

  useEffect(() => {
    const handler = () => setTokenState(null);
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthExpiryWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => {
      toast.error("Session expired. Please sign in again.");
      navigate("/", { replace: true });
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [navigate]);
  return null;
}

function RootRedirect() {
  return getToken() ? <Navigate to="/chat" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <AuthExpiryWatcher />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/chat"
              element={
                <RequireAuth>
                  <ChatPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: 12,
              fontSize: 13,
              background: "#0f172a",
              color: "#f8fafc",
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
}
