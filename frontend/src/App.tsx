import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Chatroom from "./pages/Chatroom";
import History from "./pages/History";
import Info from "./pages/Info";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import { useAuthStore } from "./lib/auth";
import api from "./lib/api";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  // auth 還在背景檢查時，避免立即跳轉 /login 造成閃爍
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * 頁面載入時嘗試用現有 cookie 呼叫 /auth/me 恢復登入狀態。
 * 不再 block UI 渲染——auth 狀態存到 store，由各頁面自行決定要不要等。
 * 這樣前導頁可以「秒開」，auth 檢查在背景進行。
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => { /* cookie 無效或不存在，維持未登入狀態 */ })
      .finally(() => setAuthLoading(false));
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/chatroom" element={<ProtectedRoute><Chatroom /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
