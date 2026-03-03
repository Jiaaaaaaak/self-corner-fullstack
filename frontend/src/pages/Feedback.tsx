import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

interface FeedbackData {
  session_uuid: string;
  scenario_title: string | null;
  sel_scores: Record<string, number>;
  feedback_text: string;
  analysis_text: string;
  selected_kist_cards: string[];
  transcript: TranscriptEntry[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    content: "您好，我是您的教育顧問專家，對於剛剛的回顧有任何問題都歡迎問我~",
  },
];

export default function Feedback() {
  const navigate = useNavigate();
  const { sessionUuid } = useAuthStore();

  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(DEFAULT_CHAT);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // =========================================================================
  // 載入回饋報告
  // =========================================================================
  useEffect(() => {
    if (!sessionUuid) {
      setIsLoading(false);
      return;
    }
    api.get(`/report/${sessionUuid}/feedback`)
      .then((res) => setFeedbackData(res.data))
      .catch((err) => console.error("[Feedback] Load error:", err))
      .finally(() => setIsLoading(false));
  }, [sessionUuid]);

  // =========================================================================
  // 雷達圖資料轉換
  // =========================================================================
  const radarData = feedbackData
    ? Object.entries(feedbackData.sel_scores).map(([subject, value]) => ({
        subject,
        value: Number(value),
      }))
    : [
        { subject: "負責任的決策", value: 0 },
        { subject: "自我管理", value: 0 },
        { subject: "社會覺察", value: 0 },
        { subject: "關係技巧", value: 0 },
        { subject: "自我覺察", value: 0 },
      ];

  // =========================================================================
  // 逐字稿分離
  // =========================================================================
  const transcript = feedbackData?.transcript ?? [];
  const teacherTranscript = transcript.filter((e) => e.speaker === "teacher");
  const studentTranscript = transcript.filter((e) => e.speaker === "student");

  // =========================================================================
  // 教練對話
  // =========================================================================
  const handleChatWithExpert = async () => {
    if (!userInput.trim() || !sessionUuid) return;

    const newUserMsg: ChatMessage = { role: "user", content: userInput.trim() };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setUserInput("");
    setIsChatLoading(true);

    try {
      const res = await api.post(`/report/${sessionUuid}/chat`, {
        message: newUserMsg.content,
        history: chatHistory, // 不包含剛加入的那則，後端會自行附加
      });
      setChatHistory([...updatedHistory, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      console.error("[Feedback] Chat error:", err);
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: "抱歉，目前無法回應，請稍後再試。" },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // =========================================================================
  // Loading / No Session State
  // =========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">正在載入回饋報告...</p>
      </div>
    );
  }

  if (!sessionUuid || !feedbackData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">尚無回饋報告，請先完成一次練習。</p>
        <Button variant="outline" onClick={() => navigate("/chatroom")}>
          前往對話空間
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-6">
          專家回饋
          {feedbackData.scenario_title && (
            <span className="text-xl font-normal text-muted-foreground ml-3">
              — {feedbackData.scenario_title}
            </span>
          )}
        </h1>

        {/* Top Section: 3 columns - Radar | Feedback | Chat */}
        <div className="grid grid-cols-3 gap-6" style={{ height: "620px" }}>
          {/* Left - Radar Chart */}
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">SEL 指標分析</h2>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "hsl(var(--foreground))",
                      fontSize: 14,
                    }}
                  />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => navigate("/chatroom")}>
                重試一次
              </Button>
              <Button variant="outline" onClick={() => navigate("/home")}>
                回首頁
              </Button>
            </div>
          </div>

          {/* Middle - Expert Feedback */}
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">回饋內容</h2>
            <ScrollArea className="flex-1">
              <p className="text-base text-foreground whitespace-pre-line leading-relaxed pr-3">
                {feedbackData.feedback_text}
              </p>
            </ScrollArea>
          </div>

          {/* Right - AI Coach Chat (merged chat + input) */}
          <div className="flex flex-col h-full overflow-hidden border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">回顧討論</h2>
            <ScrollArea className="flex-1 mb-3">
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                    >
                      <p className="text-base">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                      <p className="text-base text-muted-foreground">教練思考中...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="space-y-3 border-t pt-3">
              <Textarea
                placeholder="輸入文字..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[80px] resize-none text-base"
              />
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleChatWithExpert} disabled={isChatLoading || !userInput.trim()}>
                  與專家對話
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Transcript with toggle */}
        <div className="mt-8">
          <Tabs defaultValue="combined">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">對話紀錄</h2>
              <TabsList>
                <TabsTrigger value="combined">完整對話</TabsTrigger>
                <TabsTrigger value="separate">分開檢視</TabsTrigger>
              </TabsList>
            </div>

            {/* Combined view - back and forth */}
            <TabsContent value="combined">
              <div className="space-y-4 p-4">
                {transcript.map((entry, index) => (
                  <div key={index} className={`flex ${entry.speaker === "teacher" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${entry.speaker === "teacher" ? "bg-primary/10 text-foreground" : "bg-muted text-foreground"}`}
                    >
                      <p className="text-xs font-semibold mb-1 text-muted-foreground">
                        {entry.speaker === "teacher" ? "👩‍🏫 老師" : "🧑‍🎓 學生"}
                      </p>
                      <p className="text-base">{entry.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Separate view - teacher & student columns aligned row by row */}
            <TabsContent value="separate">
              <div className="grid grid-cols-2 gap-6 px-4 pb-2">
                <h3 className="text-lg font-semibold">【老師】對話紀錄</h3>
                <h3 className="text-lg font-semibold">【學生】對話紀錄</h3>
              </div>
              {Array.from({ length: Math.max(teacherTranscript.length, studentTranscript.length) }).map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-6">
                  <div className="px-4 py-3 border-b border-border min-h-[60px] flex items-start">
                    {teacherTranscript[index] && (
                      <p className="text-base text-foreground">{teacherTranscript[index].text}</p>
                    )}
                  </div>
                  <div className="px-4 py-3 border-b border-border min-h-[60px] flex items-start">
                    {studentTranscript[index] && (
                      <p className="text-base text-foreground">{studentTranscript[index].text}</p>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScrollArea>
  );
}
