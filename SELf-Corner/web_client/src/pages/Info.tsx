 import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import HamburgerMenu from "@/components/HamburgerMenu";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function Info() {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  const displayName = user
    ? (user.last_name || user.first_name)
      ? `${user.last_name ?? ""}${user.first_name ?? ""}`.trim()
      : user.username
    : "User";

  const [editName, setEditName] = useState(displayName);
  const [editEmail, setEditEmail] = useState(user?.email ?? "");

  useEffect(() => {
    if (!user) {
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          setEditEmail(res.data.email);
        })
        .catch(() => navigate("/login"));
    }
    // 取得歷史筆數
    api.get("/history")
      .then((res) => setSessionCount(res.data.length))
      .catch(() => {});
  }, [user, setUser, navigate]);

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "儲存成功",
      description: "您的個人資料已更新",
    });
  };

  const handleCancel = () => {
    setEditName(displayName);
    setEditEmail(user?.email ?? "");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await api.post("/auth/logout");
    clearUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      {/* Header with Hamburger Menu */}
      <div className="flex items-center gap-4 mb-6">
        <HamburgerMenu />
        <h1 className="text-2xl font-semibold">個人資料</h1>
      </div>

       {/* Usage Count Card */}
       <Card className="max-w-lg mb-6">
         <CardContent className="p-6 flex items-center gap-4">
           <div>
             <p className="text-sm text-muted-foreground">使用次數</p>
             <p className="text-3xl font-bold">{sessionCount}</p>
           </div>
         </CardContent>
       </Card>

       <Card className="max-w-lg">
         <CardHeader>
           <CardTitle className="text-lg font-medium">基本資訊</CardTitle>
         </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={displayName} />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isEditing && (
              <Button variant="outline" size="sm">
                更換頭像
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
                <Button onClick={handleSave}>儲存</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">姓名</Label>
                <p className="mt-1">{displayName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">電子郵件</Label>
                <p className="mt-1">{user?.email ?? ""}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  編輯資料
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  登出
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
