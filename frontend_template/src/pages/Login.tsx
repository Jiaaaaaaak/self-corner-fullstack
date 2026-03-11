import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "verify" | "success">("email");
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const isFilled = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFilled || isValidating) return;

    setIsValidating(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (email === "error@test.com") {
      setIsValidating(false);
      setError("帳號或密碼錯誤，請重新輸入。");
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    } else {
      navigate("/home");
    }
  };

  const validatePassword = (pwd: string): boolean => {
    return /[a-zA-Z]/.test(pwd) && pwd.length >= 10;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regUsername.trim()) errors.username = "請輸入用戶名";
    if (!regLastName.trim()) errors.lastName = "請輸入姓";
    if (!regFirstName.trim()) errors.firstName = "請輸入名";
    if (!regEmail.trim()) errors.email = "請輸入電子信箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errors.email = "信箱格式不正確";
    if (!validatePassword(regPassword)) errors.password = "密碼須至少10個字元且包含英文字母";
    if (regPassword !== regConfirmPassword) errors.confirmPassword = "密碼不一致";
    setRegErrors(errors);
    if (Object.keys(errors).length === 0) {
      toast({ title: "註冊成功", description: "請使用新帳號登入" });
      setRegisterOpen(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast({ title: "錯誤", description: "請輸入有效的電子信箱", variant: "destructive" });
      return;
    }
    setIsSendingCode(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSendingCode(false);
    setForgotStep("verify");
    toast({ title: "已發送", description: "驗證碼已發送至您的信箱" });
  };

  const handleVerifyCode = async () => {
    const code = verifyCode.join("");
    if (code.length < 6) {
      toast({ title: "錯誤", description: "請輸入完整的 6 位驗證碼", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsVerifying(false);
    setForgotStep("success");
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[index] = value;
    setVerifyCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      prev?.focus();
    }
  };

  const resetForgotFlow = () => {
    setForgotOpen(false);
    setForgotStep("email");
    setForgotEmail("");
    setVerifyCode(["", "", "", "", "", ""]);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#FAF9F6] flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Chalk Decoration */}
      <div className="absolute inset-0 chalk-dots opacity-[0.08] pointer-events-none" />
      
      <div 
        className={`w-full max-w-[440px] bg-white border border-[#E5E2D9] p-10 flex flex-col gap-6 shadow-xl rounded-2xl transition-all duration-300 relative z-10 ${
          shouldShake ? "animate-shake" : ""
        }`}
      >
        {/* Brand area */}
        <div className="flex flex-col items-center gap-1">
          <img src="/img/logo/SELf_corner_Logo_transparent.png" alt="SELf-corner" className="w-16 h-16 object-contain" />
          <h1 className="font-heading text-2xl font-bold text-[#3D3831] tracking-tight">
            SELf-corner
          </h1>
          <p className="text-[13px] text-[#706C61] italic text-center font-medium">
            每個老師，都需要一個能安心犯錯的角落。
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-[#B54A4A14] border-l-4 border-[#B54A4A] text-[#B54A4A] text-sm animate-in fade-in slide-in-from-top-1 rounded-r-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className={`flex flex-col gap-4 transition-opacity duration-300 ${isValidating ? "opacity-60" : "opacity-100"}`}>
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-widest pl-1">Email Address</label>
            <div className="flex items-center gap-2.5 h-12 px-4 border border-[#E5E2D9] bg-[#FAF9F6]/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-white transition-all rounded-xl group">
              <Mail className="w-[18px] h-[18px] text-[#A09C94] shrink-0 group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="teacher@school.edu.tw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isValidating}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#A09C94]/60 text-[#3D3831] font-medium"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-widest pl-1">Password</label>
            <div className="flex items-center gap-2.5 h-12 px-4 border border-[#E5E2D9] bg-[#FAF9F6]/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-white transition-all rounded-xl group">
              <Lock className="w-[18px] h-[18px] text-[#A09C94] shrink-0 group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isValidating}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#A09C94]/60 text-[#3D3831] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isValidating}
                className="text-[#A09C94] hover:text-[#3D3831] transition-colors shrink-0"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              disabled={isValidating}
              className="text-[12px] text-primary font-bold hover:underline transition-all"
            >
              忘記密碼？
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className={`w-full h-12 mt-2 font-heading text-[13px] font-bold tracking-[0.1em] transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg ${
              isFilled
                ? "bg-primary text-white hover:bg-[#C8694F] shadow-primary/20"
                : "bg-[#D4C4B8] text-white/60 cursor-not-allowed"
            } ${isValidating ? "cursor-wait" : ""}`}
            disabled={!isFilled || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在驗證身份...
              </>
            ) : (
              "登入系統 LOGIN"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-px bg-[#E5E2D9]" />
            <span className="text-[11px] text-[#A09C94] font-medium uppercase tracking-wider">或</span>
            <div className="flex-1 h-px bg-[#E5E2D9]" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={() => toast({ title: "Google 登入", description: "此功能尚未連接後端，敬請期待！" })}
            disabled={isValidating}
            className="w-full h-12 flex items-center justify-center gap-3 border border-[#E5E2D9] bg-white hover:bg-[#FAF9F6] rounded-xl text-[13px] font-bold text-[#3D3831] transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            使用 Google 帳號登入
          </button>

          {/* Signup link */}
          <div className="flex items-center justify-center gap-2 mt-2 text-[13px]">
            <span className="text-[#706C61] font-medium">還沒有帳號嗎？</span>
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              disabled={isValidating}
              className="text-primary font-bold hover:underline transition-all"
            >
              立即註冊
            </button>
          </div>
        </form>
      </div>

      {/* Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-[#3D3831] p-6 text-white flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="font-heading text-xl font-bold">建立教師帳號</h2>
                <p className="text-xs text-white/60 font-medium">Create your safe practice space</p>
             </div>
          </div>
          <form onSubmit={handleRegister} className="p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-wider">姓氏</Label>
                <Input placeholder="王" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-wider">名字</Label>
                <Input placeholder="大明" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-wider">電子信箱</Label>
              <Input type="email" placeholder="teacher@school.edu.tw" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#A09C94] uppercase tracking-wider">設定密碼</Label>
              <div className="relative">
                <Input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="至少 10 個字元，含英文字母"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09C94]" onClick={() => setShowRegPassword(!showRegPassword)}>
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 bg-primary text-white font-heading font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-[#C8694F]">註冊並開始練習</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => { if (!open) resetForgotFlow(); else setForgotOpen(true); }}>
        <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
          {/* Step 1: Enter email */}
          {forgotStep === "email" && (
            <>
              <div className="bg-[#3D3831] p-6 text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">重設密碼</h2>
                  <p className="text-xs text-white/60 font-medium">Reset your password</p>
                </div>
              </div>
              <form onSubmit={handleForgotPassword} className="p-8 space-y-4">
                <p className="text-sm text-[#706C61] leading-relaxed font-medium">
                  請輸入您的電子信箱，我們將發送 6 位數驗證碼給您。
                </p>
                <Input
                  type="email"
                  placeholder="您的電子信箱"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isSendingCode}
                  className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl h-12"
                />
                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSendingCode}
                    className="w-full h-12 bg-[#3D3831] text-white font-heading font-bold rounded-xl hover:bg-[#2a2723]"
                  >
                    {isSendingCode ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />發送中...</>
                    ) : (
                      "發送驗證碼"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* Step 2: Enter verification code */}
          {forgotStep === "verify" && (
            <>
              <div className="bg-[#3D3831] p-6 text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">輸入驗證碼</h2>
                  <p className="text-xs text-white/60 font-medium">Enter verification code</p>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-sm text-[#706C61] font-medium">
                    驗證碼已發送至
                  </p>
                  <p className="text-sm font-bold text-[#3D3831]">{forgotEmail}</p>
                </div>
                <div className="flex justify-center gap-2.5">
                  {verifyCode.map((digit, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-11 h-13 text-center text-xl font-heading font-bold text-[#3D3831] border-2 border-[#E5E2D9] rounded-xl bg-[#FAF9F6] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verifyCode.join("").length < 6}
                    className="w-full h-12 bg-primary text-white font-heading font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-[#C8694F]"
                  >
                    {isVerifying ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />驗證中...</>
                    ) : (
                      "確認驗證"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setForgotStep("email"); setVerifyCode(["", "", "", "", "", ""]); }}
                    className="flex items-center justify-center gap-1.5 text-[12px] text-[#706C61] font-bold hover:text-[#3D3831] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    重新輸入信箱
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {forgotStep === "success" && (
            <div className="p-10 flex flex-col items-center gap-5 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-[#81B29A]/15 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#81B29A]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-xl font-bold text-[#3D3831]">驗證成功！</h3>
                <p className="text-sm text-[#706C61] font-medium leading-relaxed">
                  密碼重設連結已發送至您的信箱，<br />請查收並完成密碼變更。
                </p>
              </div>
              <Button
                onClick={resetForgotFlow}
                className="w-full h-12 bg-[#3D3831] text-white font-heading font-bold rounded-xl hover:bg-[#2a2723] mt-2"
              >
                返回登入
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
