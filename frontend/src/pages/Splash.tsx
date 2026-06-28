import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

export default function Splash() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const [hasClickedEnter, setHasClickedEnter] = useState(false);

  // 若使用者在 auth 還在跑時就點了「進入」，等 auth 完成後自動跳轉
  useEffect(() => {
    if (hasClickedEnter && !isAuthLoading) {
      navigate(isLoggedIn ? "/home" : "/login", { replace: true });
    }
  }, [hasClickedEnter, isAuthLoading, isLoggedIn, navigate]);

  const handleEnter = () => {
    if (isAuthLoading) {
      setHasClickedEnter(true);
      return;
    }
    navigate(isLoggedIn ? "/home" : "/login", { replace: true });
  };

  const showButtonSpinner = hasClickedEnter && isAuthLoading;

  return (
    <div className="fixed inset-0 bg-[#FAF9F6] overflow-hidden flex flex-col items-center justify-between py-12 px-6">
      {/* 背景柔和光暈 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#E8C9A8]/30 blur-3xl pointer-events-none" />

      {/* 頂部留白 spacer */}
      <div className="shrink-0 h-2" />

      {/* 主內容區 */}
      <div className="relative z-10 flex flex-col items-center max-w-md">
        {/* Logo */}
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <img
            src="/img/logo/SELf_corner_Logo_transparent.png"
            alt="SELf-Corner"
            className="w-48 md:w-56 h-auto mb-10 drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/img/logo/SELf_corner_Logo.png";
            }}
          />
        </div>

        {/* 分隔線 */}
        <div
          className="w-12 h-0.5 bg-primary/60 rounded-full mb-6 animate-in fade-in zoom-in duration-700"
          style={{ animationDelay: "150ms", animationFillMode: "both" }}
        />

        {/* Tagline */}
        <p
          className="text-base md:text-lg text-[#706C61] font-medium tracking-[0.15em] mb-14 text-center animate-in fade-in slide-in-from-bottom-2 duration-700"
          style={{ animationDelay: "250ms", animationFillMode: "both" }}
        >
          給教師一個安全的試錯空間
        </p>

        {/* CTA */}
        <button
          onClick={handleEnter}
          disabled={showButtonSpinner}
          className="group flex items-center gap-3 px-10 py-3.5 bg-primary text-white rounded-full font-heading font-bold shadow-lg hover:shadow-xl hover:bg-[#C8694F] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 animate-in fade-in zoom-in-95 duration-700"
          style={{ animationDelay: "400ms", animationFillMode: "both" }}
        >
          {showButtonSpinner ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="tracking-widest text-sm">服務喚醒中</span>
            </>
          ) : (
            <>
              <span className="tracking-widest text-sm">進　入</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </button>

        {/* 冷啟動小提示，只在等待時顯示，避免使用者誤以為當機 */}
        {showButtonSpinner && (
          <p className="mt-4 text-[11px] text-[#A09C94] font-medium tracking-wide animate-in fade-in duration-500">
            首次造訪需數秒喚醒伺服器，請稍候...
          </p>
        )}
      </div>

      {/* 底部小字 */}
      <p
        className="relative z-10 text-[10px] text-[#A09C94] font-medium tracking-[0.2em] uppercase animate-in fade-in duration-1000"
        style={{ animationDelay: "600ms", animationFillMode: "both" }}
      >
        Social Emotional Learning · for Teachers
      </p>
    </div>
  );
}
