import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dices, RefreshCw, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HamburgerMenu from "@/components/HamburgerMenu";
import ScenarioCard from "@/components/chatroom/ScenarioCard";
import ScenarioDetail from "@/components/chatroom/ScenarioDetail";
import RandomConfirm from "@/components/chatroom/RandomConfirm";
import ChatPanel from "@/components/chatroom/ChatPanel";
import classroomBackground from "@/assets/classroom-background.png";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const allScenarios = [
  { id: 1, title: "考場失利後的自責", tag: "自我覺察", emoji: "📝", description: "學生在一次重要考試中表現不佳，感到極度自責和沮喪。他開始質疑自己的能力，甚至不想再上學。作為老師，你需要引導他認識情緒、接納失敗，並重建自信。" },
  { id: 2, title: "分組被落單的窘迫", tag: "社交意識", emoji: "👥", description: "班上分組活動時，有一位學生總是最後一個被選或直接被遺漏。他表面上裝作無所謂，但內心其實很受傷。你需要幫助他理解社交動態，並找到融入團體的方式。" },
  { id: 3, title: "被當眾誤解的憤怒", tag: "自我管理", emoji: "😤", description: "學生在課堂上被同學誤解並當眾指責，他非常憤怒，差點失控動手。你需要在這個情緒高漲的時刻幫助他冷靜下來，學習如何管理憤怒情緒。" },
  { id: 4, title: "好朋友吵架的糾結", tag: "人際技巧", emoji: "🤝", description: "兩個好朋友因為一件小事吵架了，其中一位來找你傾訴。他既想和好，又覺得委屈。你需要引導他學習溝通技巧，修復友誼關係。" },
  { id: 5, title: "面對新環境的焦慮", tag: "適應能力", emoji: "🌱", description: "學生剛轉學到新班級，對陌生的環境和同學感到極度焦慮。他不敢主動交朋友，午餐時間總是一個人。你需要幫助他建立安全感，逐步適應新環境。" },
  { id: 6, title: "承認作弊後的羞愧", tag: "負責決策", emoji: "💭", description: "學生在考試中作弊被發現，他感到非常羞愧，不知道如何面對老師和同學。你需要引導他理解誠實的重要性，並幫助他做出負責任的決定。" },
  { id: 7, title: "被老師點名的緊張", tag: "自我管理", emoji: "😰", description: "學生每次被老師點名回答問題時都會極度緊張，甚至說不出話來。這種情況讓他越來越害怕上課。你需要幫助他找到管理緊張情緒的方法。" },
  { id: 8, title: "同學說謊的兩難", tag: "負責決策", emoji: "🤔", description: "學生發現好朋友對老師撒了謊，他陷入兩難——告訴老師會背叛朋友，不說又覺得不對。你需要引導他思考道德決策的複雜性。" },
  { id: 9, title: "排擠他人的罪惡感", tag: "社交意識", emoji: "😔", description: "學生參與了排擠班上某位同學的行為，事後感到強烈的罪惡感。他不知道該如何彌補。你需要幫助他理解自己行為對他人的影響，並採取修復行動。" },
  { id: 10, title: "比賽輸了的不甘心", tag: "自我覺察", emoji: "🏆", description: "學生在校際比賽中惜敗，覺得不公平而非常不甘心，甚至遷怒隊友。你需要幫助他處理失落情緒，並學會從失敗中成長。" },
];

const DISPLAY_COUNT = 6;

function pickRandomScenarios(pool: typeof allScenarios, count: number) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function Chatroom() {
  const navigate = useNavigate();
  const { setSessionUuid } = useAuthStore();

  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [showRandomConfirm, setShowRandomConfirm] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [displayedScenarios, setDisplayedScenarios] = useState(() =>
    pickRandomScenarios(allScenarios, DISPLAY_COUNT)
  );

  // LiveKit 連線資訊
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [currentSessionUuid, setCurrentSessionUuid] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const selectedScenario = allScenarios.find((s) => s.id === selectedScenarioId) || null;

  const handleCardClick = (id: number) => {
    setSelectedScenarioId(id);
  };

  const handleRandomClick = () => {
    setShowRandomConfirm(true);
  };

  const handleRefresh = () => {
    setDisplayedScenarios(pickRandomScenarios(allScenarios, DISPLAY_COUNT));
  };

  const handleStart = async () => {
    const scenarioId = showRandomConfirm
      ? allScenarios[Math.floor(Math.random() * allScenarios.length)].id
      : selectedScenarioId;

    if (!scenarioId) return;

    try {
      // 1. 建立 Session
      const sessionRes = await api.post("/session/create", { scenario_id: scenarioId });
      const { session_uuid, livekit_room_name } = sessionRes.data;

      // 2. 取得 LiveKit Token
      const tokenRes = await api.post("/livekit/token", { session_uuid });
      const { token, url } = tokenRes.data;

      // 3. 儲存到 store 供 Feedback 頁面使用
      setSessionUuid(session_uuid);
      setCurrentSessionUuid(session_uuid);
      setLivekitToken(token);
      setLivekitUrl(url);

      console.log(`[Chatroom] Session: ${session_uuid}, Room: ${livekit_room_name}`);

      setIsStarted(true);
      setIsPaused(false);
      setSelectedScenarioId(null);
      setShowRandomConfirm(false);
    } catch (err) {
      console.error(err);
      toast({ title: "無法開始對話", description: "請稍後再試", variant: "destructive" });
    }
  };

  const handleCloseDetail = () => {
    setSelectedScenarioId(null);
    setShowRandomConfirm(false);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleEnd = async () => {
    setIsEnding(true);
    if (currentSessionUuid) {
      try {
        await api.post(`/session/${currentSessionUuid}/end`);
      } catch (err) {
        console.error("[Chatroom] End session error:", err);
      }
    }
    setIsEnding(false);
    navigate("/feedback");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <HamburgerMenu />
          <h1 className="text-xl font-semibold">對話空間</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
          <HelpCircle className="h-4 w-4 mr-1" />
          使用說明
        </Button>
      </div>

      {/* Main Area */}
      <div className="h-[calc(100vh-7rem)] rounded-lg overflow-hidden relative">
        <img
          src={classroomBackground}
          alt="教室背景"
          className={`w-full h-full object-cover transition-all duration-500 ${
            isPaused ? "opacity-40" : "opacity-100"
          }`}
        />

        {/* Paused overlay */}
        {isStarted && isPaused && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-foreground font-bold text-2xl bg-background/60 px-6 py-3 rounded-lg">
              ⏸ 對話暫停
            </span>
          </div>
        )}

        {/* Scenario Selection (before start) */}
        {!isStarted && !selectedScenario && !showRandomConfirm && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm p-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-background drop-shadow-md">選擇練習情境</h2>
              <Button variant="ghost" size="icon" onClick={handleRefresh} className="rounded-full" title="換一批情境">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-muted-foreground mb-6">請選擇一個你想練習的對話情境</p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl w-full mb-4">
              {displayedScenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} onClick={handleCardClick} />
              ))}
            </div>

            {/* Random card */}
            <Card
              onClick={handleRandomClick}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg border-2 border-dashed border-border/60 bg-card/80 backdrop-blur-md hover:border-primary/40 max-w-2xl w-full"
            >
              <CardContent className="p-4 text-center space-y-2 flex flex-col items-center justify-center">
                <Dices className="h-7 w-7 text-muted-foreground" />
                <p className="font-medium text-sm leading-tight text-foreground">隨機情境</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
                  驚喜挑戰
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flipped scenario detail */}
        {!isStarted && selectedScenario && (
          <ScenarioDetail scenario={selectedScenario} onClose={handleCloseDetail} onStart={handleStart} />
        )}

        {/* Random confirm */}
        {!isStarted && showRandomConfirm && (
          <RandomConfirm onClose={handleCloseDetail} onStart={handleStart} />
        )}

        {/* Virtual student during session */}
        {isStarted && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted border-2 border-border flex items-center justify-center text-5xl">
                {isPaused ? "😶" : "🧑‍🎓"}
              </div>
              <span className="mt-2 text-sm text-foreground font-medium bg-background/60 px-3 py-1 rounded-full">
                虛擬學生
              </span>
            </div>

            {/* Chat Panel with LiveKit integration */}
            <ChatPanel
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              onEnd={handleEnd}
              livekitToken={livekitToken}
              livekitUrl={livekitUrl}
              isEnding={isEnding}
            />
          </>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>使用說明</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>歡迎來到對話空間！以下是操作說明：</p>
            <ul className="list-disc list-inside space-y-2">
              <li>選擇一個情境卡片，查看詳細說明後開始對話</li>
              <li>也可以選擇「隨機情境」讓系統為您挑選</li>
              <li>對話中可以透過文字或語音與虛擬學生互動</li>
              <li>按暫停鍵可凍結對話，按繼續鍵恢復</li>
              <li>按結束按鈕可結束對話並查看回饋</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
