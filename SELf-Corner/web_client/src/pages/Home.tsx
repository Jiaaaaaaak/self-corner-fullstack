import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import HamburgerMenu from "@/components/HamburgerMenu";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function Home() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      api.get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => navigate("/login"));
    }
  }, [user, setUser, navigate]);

  const displayName = user
    ? (user.last_name || user.first_name)
      ? `${user.last_name ?? ""}${user.first_name ?? ""}`.trim()
      : user.username
    : "User";

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <HamburgerMenu />
        <Avatar className="h-12 w-12">
          <AvatarImage src="" alt={displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-lg">hi, {displayName}</span>
      </div>

      {/* About Us Section */}
      <section className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">關於 SELf-corner</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            一個為教師設計的 SEL（社會情緒學習）對話練習平台
          </p>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">🎯 平台初衷</h2>
            <p className="text-foreground leading-relaxed">
              在教育現場，老師們經常面臨學生的情緒事件——考試焦慮、人際衝突、自我懷疑。然而，如何有效回應這些情境，往往缺乏系統化的練習機會。SELf-corner 希望透過模擬真實的師生對話場景，讓教師在安全的環境中反覆練習，提升社會情緒輔導的敏感度與技巧。
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">💡 我們相信</h2>
            <p className="text-foreground leading-relaxed">
              每一位老師都有能力成為學生情緒成長的引路人。透過 AI 模擬的虛擬學生，教師可以在不同情境中練習傾聽、同理與引導，並獲得即時的專家回饋，逐步建立更自信的輔導能力。
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">🌱 五大 SEL 核心能力</h2>
            <p className="text-foreground leading-relaxed">
              本平台的情境設計圍繞 CASEL 提出的五大社會情緒學習核心能力：
            </p>
            <ul className="list-disc list-inside text-foreground space-y-1 ml-2">
              <li><strong>自我覺察</strong>——辨識自身情緒與想法</li>
              <li><strong>自我管理</strong>——有效調節情緒與行為</li>
              <li><strong>社交意識</strong>——理解他人觀點與感受</li>
              <li><strong>人際技巧</strong>——建立健康的溝通與關係</li>
              <li><strong>負責決策</strong>——做出具倫理與建設性的選擇</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">🔧 如何運作</h2>
            <p className="text-foreground leading-relaxed">
              選擇一個對話情境，與 AI 虛擬學生進行模擬對話。對話結束後，系統將根據您的回應提供 SEL 指標分析與專家建議，幫助您持續精進輔導技能。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
