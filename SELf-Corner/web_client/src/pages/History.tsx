import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface HistoryItem {
  session_uuid: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  scenario_title: string | null;
  sel_scores: Record<string, number> | null;
  has_report: boolean;
}

export default function History() {
  const navigate = useNavigate();
  const { setSessionUuid } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    api.get("/history")
      .then((res) => setHistoryItems(res.data))
      .catch((err) => console.error("[History] Load error:", err));
  }, []);

  const filteredHistory = historyItems.filter(
    (item) =>
      (item.scenario_title ?? item.title)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.started_at.includes(searchQuery)
  );

  const formatDate = (iso: string) => iso.split("T")[0];

  const handleItemClick = (item: HistoryItem) => {
    if (item.has_report) {
      setSessionUuid(item.session_uuid);
      navigate("/feedback");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      {/* Header with Hamburger Menu */}
      <div className="flex items-center gap-4 mb-6">
        <HamburgerMenu />
        <h1 className="text-2xl font-semibold">歷史紀錄</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">所有紀錄</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋歷史紀錄..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.session_uuid}
                className="py-3 px-2 border-b border-dashed border-border last:border-0 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <span className="text-sm text-muted-foreground">{formatDate(item.started_at)}</span>
                <span className="ml-4">{item.scenario_title ?? item.title}</span>
                {item.has_report && (
                  <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    有報告
                  </span>
                )}
              </div>
            ))}
            {filteredHistory.length === 0 && searchQuery && (
              <div className="py-2 text-muted-foreground text-sm">找不到符合的紀錄</div>
            )}
            {historyItems.length === 0 && !searchQuery && (
              <div className="py-2 text-muted-foreground text-sm">尚無歷史紀錄</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
