import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Radar as RechartRadar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowRight, Lightbulb, Sparkles, RefreshCw, Share2, MessageSquare, MessageCircle, Activity, PlusCircle, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

interface EmotionLogEntry {
  turn_number: number;
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  anxious: number;
  frustrated: number;
  confident: number;
  curious: number;
  neutral: number;
}

interface FeedbackReport {
  session_uuid: string;
  scenario_title: string | null;
  sel_scores: Record<string, number>;
  feedback_text: string;
  analysis_text: string;
  selected_kist_cards: string[];
  transcript: TranscriptEntry[];
  emotion_logs: EmotionLogEntry[];
  generated_at: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Emotion line colors for the 9 emotions
const EMOTION_COLORS: Record<string, string> = {
  happy: "#F59E0B",
  sad: "#6366F1",
  angry: "#EF4444",
  surprised: "#8B5CF6",
  anxious: "#F97316",
  frustrated: "#DC2626",
  confident: "#10B981",
  curious: "#3B82F6",
  neutral: "#9CA3AF",
};

const EMOTION_LABELS: Record<string, string> = {
  happy: "開心",
  sad: "悲傷",
  angry: "憤怒",
  surprised: "驚訝",
  anxious: "焦慮",
  frustrated: "挫折",
  confident: "自信",
  curious: "好奇",
  neutral: "中性",
};

const SEL_LABELS: Record<string, string> = {
  self_awareness: "自我覺察",
  self_management: "自我管理",
  social_awareness: "社會覺察",
  relationship_skills: "人際技巧",
  responsible_decision: "負責決策",
};

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionUuid } = useAuthStore();

  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!sessionUuid) {
      setError("找不到練習 Session，請先進行一次練習");
      setLoading(false);
      return;
    }
    api.get(`/report/${sessionUuid}/feedback`)
      .then((res) => {
        setReport(res.data);
        // Seed initial coach message
        setChatHistory([
          {
            role: "assistant",
            content: "老師辛苦了！這是一場不容易的對話。關於剛剛的分析報告，或是針對學生的情況，您有任何想進一步討論的嗎？",
          },
        ]);
      })
      .catch((err) => {
        setError(err.response?.data?.detail ?? "載入報告失敗，請稍後再試");
      })
      .finally(() => setLoading(false));
  }, [sessionUuid]);

  const handleRetry = () => {
    const scenarioId = location.state?.currentScenarioId;
    navigate("/chatroom", { state: { retryScenarioId: scenarioId } });
  };

  const handleSendCoach = async () => {
    if (!userInput.trim() || isSending || !sessionUuid) return;
    const message = userInput.trim();
    setUserInput("");
    setIsSending(true);
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    try {
      const res = await api.post(`/report/${sessionUuid}/chat`, {
        message,
        history: chatHistory,
      });
      setChatHistory([...newHistory, { role: "assistant", content: res.data.reply }]);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "（回應失敗，請稍後再試）" }]);
    } finally {
      setIsSending(false);
    }
  };

  // Build radar data from sel_scores
  const radarData = report
    ? Object.entries(report.sel_scores).map(([key, value]) => ({
        subject: SEL_LABELS[key] ?? key,
        value: typeof value === "number" ? value * 10 : value,
      }))
    : [];

  // Build emotion flow data from emotion_logs
  const emotionChartData = (report?.emotion_logs ?? []).map((log) => ({
    turn: `T${log.turn_number}`,
    happy: Math.round(log.happy * 100),
    sad: Math.round(log.sad * 100),
    angry: Math.round(log.angry * 100),
    surprised: Math.round(log.surprised * 100),
    anxious: Math.round(log.anxious * 100),
    frustrated: Math.round(log.frustrated * 100),
    confident: Math.round(log.confident * 100),
    curious: Math.round(log.curious * 100),
    neutral: Math.round(log.neutral * 100),
  }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-[#706C61] font-medium">{error}</p>
          <button
            onClick={() => navigate("/chatroom")}
            className="h-11 px-6 bg-primary text-white rounded-xl font-heading font-bold"
          >
            開始練習
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 md:p-12 max-w-7xl mx-auto flex flex-col gap-10 min-h-full animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-12 lg:pl-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <Badge className="bg-[#81B29A15] text-[#81B29A] border-[#81B29A30] font-heading font-bold text-[10px] tracking-widest uppercase">Session Completed</Badge>
               <span className="text-[11px] font-bold text-[#A09C94] uppercase tracking-wider">
                 {report?.generated_at ? new Date(report.generated_at).toLocaleString("zh-TW") : ""}
               </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-[#3D3831] tracking-tight mt-2">專家回饋與深度分析</h1>
            {report?.scenario_title && (
              <p className="text-[15px] text-[#706C61] font-medium">情境：{report.scenario_title}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="h-11 px-6 border-2 border-[#E5E2D9] rounded-xl font-heading text-sm font-bold text-[#3D3831] hover:bg-white hover:border-[#3D3831] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重試一次
            </button>
            <button
              onClick={() => navigate("/chatroom")}
              className="h-11 px-6 border-2 border-primary/30 rounded-xl font-heading text-sm font-bold text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              練新情境
            </button>
            <button className="h-11 px-6 bg-primary text-white rounded-xl font-heading text-sm font-bold shadow-lg shadow-primary/20 hover:bg-[#C8694F] transition-all flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              分享練習
            </button>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: Metrics & Charts */}
          <div className="lg:w-[440px] shrink-0 flex flex-col gap-8">
            {/* Radar Card */}
            <div className="bg-white border border-[#E5E2D9] rounded-2xl shadow-sm p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <h2 className="font-heading text-lg font-bold text-[#3D3831]">五力指標分佈</h2>
              </div>
              <div className="h-[300px] bg-[#FAF9F6] rounded-xl flex items-center justify-center overflow-hidden border border-[#E5E2D9]/50">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
                    <PolarGrid stroke="#E5E2D9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#706C61", fontSize: 11, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <RechartRadar name="本次表現" dataKey="value" stroke="#E07A5F" strokeWidth={3} fill="#E07A5F" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Emotion Flow Card */}
            <div className="bg-white border border-[#E5E2D9] rounded-2xl shadow-sm p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h2 className="font-heading text-lg font-bold text-[#3D3831]">學生情緒流動</h2>
                 </div>
              </div>
              {emotionChartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                      <XAxis
                        dataKey="turn"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#A09C94', fontSize: 10, fontWeight: 600 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#706C61', fontSize: 10, fontWeight: 600 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 12 }}
                        formatter={(value: number, name: string) => [`${value}%`, EMOTION_LABELS[name] ?? name]}
                      />
                      <Legend
                        formatter={(value) => EMOTION_LABELS[value] ?? value}
                        wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      />
                      {Object.keys(EMOTION_COLORS).map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={EMOTION_COLORS[key]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#A09C94] text-sm font-medium">
                  本次練習未記錄情緒資料
                </div>
              )}
            </div>

            {/* Expert Suggestions */}
            <div className="bg-white border border-[#E5E2D9] rounded-2xl shadow-sm p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                   <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-bold text-[#3D3831]">核心優化建議</h2>
              </div>
              <ScrollArea className="h-[260px] pr-4">
                <div className="space-y-4">
                  <div className="p-5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl">
                    <p className="text-sm text-[#706C61] font-medium leading-relaxed whitespace-pre-line">
                      {report?.feedback_text ?? ""}
                    </p>
                  </div>
                  {report?.analysis_text && (
                    <div className="bg-white border-l-4 border-primary p-4 rounded-r-xl shadow-sm">
                      <MessageSquare className="w-4 h-4 text-primary mb-2 opacity-50" />
                      <p className="text-[13px] font-bold text-[#3D3831] leading-relaxed italic">
                        {report.analysis_text}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right: Transcript & AI Coach */}
          <div className="flex-1 flex flex-col gap-8 min-w-0">
            {/* Transcript Card */}
            <div className="bg-white border border-[#E5E2D9] rounded-2xl shadow-sm flex flex-col flex-1 min-h-[500px] overflow-hidden">
              <div className="flex items-center px-8 py-5 border-b border-[#E5E2D9] bg-[#FAF9F6]/50">
                <div className="flex items-center gap-3">
                   <MessageCircle className="w-5 h-5 text-primary" />
                   <h2 className="font-heading text-lg font-bold text-[#3D3831]">對話逐字稿回顧</h2>
                </div>
              </div>

              <ScrollArea className="flex-1 px-8 py-8">
                <div className="space-y-6">
                  {(report?.transcript ?? []).map((entry, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${entry.speaker === "teacher" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[80%] px-5 py-4 shadow-sm border ${
                          entry.speaker === "teacher"
                            ? "bg-primary text-white border-primary/10 rounded-[20px] rounded-tr-none"
                            : "bg-white border-[#E5E2D9] text-[#3D3831] rounded-[20px] rounded-tl-none font-medium"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-60">
                          {entry.speaker === "teacher" ? "Teacher" : "Student"}
                        </span>
                        <p className="text-[15px] leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                  {(report?.transcript ?? []).length === 0 && (
                    <div className="py-16 text-center text-[#A09C94] font-medium">
                      暫無對話紀錄
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* AI Coach Card */}
            <div className="bg-[#3D3831] rounded-2xl shadow-xl p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg">
                   <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-heading text-lg font-bold text-white tracking-wide">與 AI 專業督導對話</h2>
              </div>

              <ScrollArea className="max-h-[240px] relative z-10">
                <div className="flex flex-col gap-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] px-5 py-4 text-sm leading-relaxed rounded-[18px] font-medium ${
                        msg.role === "user"
                          ? "bg-primary/80 text-white rounded-tr-none"
                          : "bg-white/10 border border-white/10 text-white/90 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 border border-white/10 px-5 py-3 rounded-[18px] rounded-tl-none">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="relative z-10 flex flex-col gap-3">
                <Textarea
                  placeholder="詢問督導建議：例如『如何更好地處理學生的抵觸情緒？』"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendCoach(); } }}
                  className="min-h-[100px] resize-none text-[15px] border-white/10 bg-white/5 text-white placeholder:text-white/30 rounded-xl focus:ring-secondary/50 focus:border-secondary transition-all"
                />
                <button
                  onClick={handleSendCoach}
                  disabled={isSending || !userInput.trim()}
                  className="h-12 w-full bg-secondary text-white font-heading font-bold text-sm tracking-widest rounded-xl hover:bg-[#6FA088] hover:shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  發送諮詢訊息
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
