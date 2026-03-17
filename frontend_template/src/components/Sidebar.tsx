import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  House,
  MessageCircle,
  Radar,
  Clock3,
  BookOpen,
  User,
  LogOut,
  ChevronRight,
  Pause,
  ClipboardCheck,
} from "lucide-react";

const navItems = [
  { label: "首頁 Home", icon: House, path: "/home" },
  { label: "對話練習", icon: MessageCircle, path: "/chatroom" },
  { label: "歷史紀錄", icon: Clock3, path: "/history" },
  { label: "個人帳號", icon: User, path: "/info" },
];

// Session nav items shown during active practice
const sessionNavItems = [
  { label: "對話", icon: MessageCircle, id: "chat" },
];

interface SidebarProps {
  onNavigate?: () => void;
  sessionInfo?: {
    scenarioTitle: string;
    formattedTime: string;
    isPaused: boolean;
    onTogglePause: () => void;
    onEnd: () => void;
  };
}

export default function Sidebar({ onNavigate, sessionInfo }: SidebarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = {
    name: "王老師",
    email: "teacher@school.edu.tw",
    initial: "W",
  };

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full w-[260px] bg-[#1E1D1B] text-[#FAF9F6] py-8 px-0 border-r border-white/5">
      {/* Brand area */}
      <div className="flex items-center gap-3 px-6 mb-12">
        <img src="/img/logo/SELf_corner_Logo_transparent.png" alt="SELf-corner" className="w-7 h-7 rounded-sm shadow-sm object-contain" />
        <span className="font-heading text-base font-bold tracking-widest uppercase">
          SELf-corner
        </span>
      </div>

      {/* Session Info - shown during active practice */}
      {sessionInfo && (
        <div className="px-6 mb-8">
          <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
            CURRENT SESSION
          </span>
          <h3 className="font-heading text-sm font-bold text-[#FAF9F6] mt-2 leading-snug">
            {sessionInfo.scenarioTitle}
          </h3>
          <span className="font-heading text-3xl font-bold text-[#FAF9F6] mt-3 block tabular-nums tracking-wider">
            {sessionInfo.formattedTime}
          </span>
        </div>
      )}

      {/* Nav section */}
      {sessionInfo ? (
        <>
          <div className="px-6 mb-4">
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-[#706C61]">
              SESSION
            </span>
          </div>
          <nav className="flex flex-col gap-1.5 px-3">
            {sessionNavItems.map((item) => {
              const active = item.id === "chat";
              return (
                <button
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 text-[13px] font-heading font-semibold transition-all rounded-sm group relative ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-[#A09C94] hover:text-[#FAF9F6] hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-[#FAF9F6]"}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      ) : (
        <>
          <div className="px-6 mb-4">
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-[#706C61]">
              MAIN NAVIGATION
            </span>
          </div>
          <nav className="flex flex-col gap-1.5 px-3">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 text-[13px] font-heading font-semibold transition-all rounded-sm group relative ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-[#A09C94] hover:text-[#FAF9F6] hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-[#FAF9F6]"}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-primary/50" />}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Session controls */}
      {sessionInfo && (
        <div className="px-3 mb-6 flex flex-col gap-1.5">
          <button
            onClick={sessionInfo.onTogglePause}
            className="flex items-center gap-3 w-full px-4 py-3 text-[13px] font-heading font-semibold text-[#A09C94] hover:text-[#FAF9F6] hover:bg-white/5 transition-all rounded-sm group"
          >
            <Pause className="w-5 h-5 shrink-0 group-hover:text-[#FAF9F6] transition-colors" />
            <span>{sessionInfo.isPaused ? "繼續練習" : "暫停練習"}</span>
          </button>
          <button
            onClick={sessionInfo.onEnd}
            className="flex items-center gap-3 w-full px-4 py-3 text-[13px] font-heading font-semibold text-primary hover:text-primary hover:bg-primary/10 transition-all rounded-sm group"
          >
            <ClipboardCheck className="w-5 h-5 shrink-0 text-primary transition-colors" />
            <span>結束對話並分析</span>
          </button>
        </div>
      )}

      {/* User profile + logout */}
      <div className="px-6 py-1.5 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-[#3D3831] border border-white/10 flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => handleNav("/info")}
          >
            <span className="font-heading text-sm font-bold text-primary">
              {user.initial}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => handleNav("/info")}>
            <span className="font-heading text-[13px] font-bold truncate hover:text-primary transition-colors">
              {user.name}
            </span>
            <span className="text-[10px] text-[#706C61] truncate">
              教育訓練模式
            </span>
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-1.5 shrink-0 px-2 py-1.5 text-[11px] font-heading font-semibold text-[#706C61] hover:text-[#FAF9F6] transition-all rounded-sm group ml-2"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 group-hover:text-destructive transition-colors" />
            <span>登出</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="sm:max-w-sm rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg text-[#3D3831]">確定要登出嗎？</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#706C61]">
              登出後將返回登入頁面，您的練習進度已自動儲存。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-[#E5E2D9] text-[#706C61] font-heading font-bold text-sm hover:bg-[#FAF9F6]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleNav("/login")}
              className="rounded-xl bg-destructive text-white font-heading font-bold text-sm hover:bg-destructive/90"
            >
              確定登出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
