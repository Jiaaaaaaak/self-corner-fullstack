import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function HamburgerMenu() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  const handleInstructionOpen = () => {
    setSheetOpen(false);
    setInstructionOpen(true);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>選單</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => handleNavigate("/home")}>
              首頁
            </Button>
            <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => handleNavigate("/history")}>
              歷史紀錄
            </Button>
            <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => handleNavigate("/info")}>
              個人資料
            </Button>
            <Button variant="ghost" className="justify-start h-12 text-base" onClick={handleInstructionOpen}>
              使用說明
            </Button>
            <Button
              variant="ghost"
              className="justify-start h-12 text-base"
              onClick={() => handleNavigate("/chatroom")}
            >
              對話空間
            </Button>
            <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => handleNavigate("/login")}>
              登出
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <Dialog open={instructionOpen} onOpenChange={setInstructionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>使用說明</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>歡迎使用本系統！以下是基本操作說明：</p>
            <ul className="list-disc list-inside space-y-2">
              <li>首頁：查看您的使用紀錄和基本資訊</li>
              <li>歷史紀錄：瀏覽過去的對話記錄</li>
              <li>個人資料：管理您的帳戶設定</li>
              <li>對話空間：開始新的教學對話</li>
            </ul>
            <p>如有任何問題，請聯繫客服支援。</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
