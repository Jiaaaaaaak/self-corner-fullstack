import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  // Registration dialog state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/login", { account, password });
      const meRes = await api.get("/auth/me");
      setUser(meRes.data);
      navigate("/home");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "登入失敗，請檢查帳號密碼";
      toast({ title: "登入失敗", description: msg, variant: "destructive" });
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google auth
    navigate("/home");
  };

  const validatePassword = (pwd: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasMinLength = pwd.length >= 10;
    return hasLetter && hasMinLength;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!regUsername.trim()) errors.username = "請輸入用戶名";
    if (!regLastName.trim()) errors.lastName = "請輸入姓";
    if (!regFirstName.trim()) errors.firstName = "請輸入名";
    if (!regEmail.trim()) errors.email = "請輸入電子信箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errors.email = "信箱格式不正確";

    if (!validatePassword(regPassword)) {
      errors.password = "密碼須至少10個字元且包含英文字母";
    }
    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = "密碼不一致";
    }

    setRegErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        await api.post("/auth/register", {
          username: regUsername,
          email: regEmail,
          password: regPassword,
          first_name: regFirstName,
          last_name: regLastName,
        });
        toast({ title: "註冊成功", description: "請使用新帳號登入" });
        setRegisterOpen(false);
        resetRegisterForm();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "註冊失敗";
        toast({ title: "註冊失敗", description: msg, variant: "destructive" });
      }
    }
  };

  const resetRegisterForm = () => {
    setRegUsername("");
    setRegLastName("");
    setRegFirstName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegErrors({});
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast({ title: "錯誤", description: "請輸入有效的電子信箱", variant: "destructive" });
      return;
    }
    await api.post("/auth/forgot-password", { email: forgotEmail });
    toast({ title: "已發送", description: "密碼重設信件已發送至您的信箱" });
    setForgotOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">登入</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="帳號"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            <div className="relative">
              <Input
                type={showLoginPassword ? "text" : "password"}
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline" size="sm">
                登入
              </Button>
              <span className="text-sm text-muted-foreground">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setRegisterOpen(true)}
                >
                  註冊
                </button>
                {" | "}
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setForgotOpen(true)}
                >
                  忘記密碼
                </button>
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              Login with Google
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>註冊</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <Input
                placeholder="用戶名 (ID)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              {regErrors.username && <p className="text-sm text-destructive mt-1">{regErrors.username}</p>}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="姓"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                />
                {regErrors.lastName && <p className="text-sm text-destructive mt-1">{regErrors.lastName}</p>}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="名"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                />
                {regErrors.firstName && <p className="text-sm text-destructive mt-1">{regErrors.firstName}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder="電子信箱"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              {regErrors.email && <p className="text-sm text-destructive mt-1">{regErrors.email}</p>}
            </div>
            <div>
              <div className="relative">
                <Input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="密碼 (至少10字元，含英文)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {regErrors.password && <p className="text-sm text-destructive mt-1">{regErrors.password}</p>}
            </div>
            <div>
              <div className="relative">
                <Input
                  type={showRegConfirmPassword ? "text" : "password"}
                  placeholder="確認密碼"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                >
                  {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {regErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{regErrors.confirmPassword}</p>}
            </div>
            <DialogFooter>
              <Button type="submit">註冊</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>忘記密碼</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              請輸入您的電子信箱，我們將發送密碼重設連結。
            </p>
            <Input
              type="email"
              placeholder="電子信箱"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <DialogFooter>
              <Button type="submit">發送驗證信</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
