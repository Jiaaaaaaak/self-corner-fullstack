import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import classroomBg from "@/assets/classroom-background.png";
import {
  HelpCircle,
  AlertCircle,
  Play,
  Mic,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ScenarioDetail from "@/components/chatroom/ScenarioDetail";
import ChatPanel from "@/components/chatroom/ChatPanel";
import SkillTreeMap from "@/components/chatroom/SkillTreeMap";
import SoulCards from "@/components/chatroom/SoulCards";
import StudentProfileSelect, { type StudentProfile, PERSONALITY_TRAITS, GRADE_LEVELS } from "@/components/chatroom/StudentProfileSelect";
import { buildCompetencyGroups, type Scenario, type CompetencyGroup } from "@/lib/collectionData";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function Chatroom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionUuid } = useAuthStore();

  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [competencyGroups, setCompetencyGroups] = useState<CompetencyGroup[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [studentEmotion, setStudentEmotion] = useState<"neutral" | "angry" | "sad" | "thinking">("neutral");
  const [studentName, setStudentName] = useState("小明");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [pendingScenario, setPendingScenario] = useState<Scenario | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);
  const [soulCardsOpen, setSoulCardsOpen] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [currentSessionUuid, setCurrentSessionUuid] = useState<string | null>(null);

  // Load scenarios from API
  useEffect(() => {
    api.get("/scenarios").then((res) => {
      const data: Scenario[] = res.data.map((s: any) => ({
        id: s.id,
        title: s.title,
        tag: s.sel_category ?? "自我覺察",
        emoji: s.emoji ?? "📝",
        description: s.description ?? "",
      }));
      setAllScenarios(data);
      setCompetencyGroups(buildCompetencyGroups(data));
    }).catch(() => {
      // leave empty — SkillTreeMap will show empty state
    });
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isStarted && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isPaused]);

  // Handle Retry logic
  useEffect(() => {
    const retryId = location.state?.retryScenarioId;
    if (retryId && allScenarios.length > 0) {
      const scenario = allScenarios.find((s) => s.id === retryId);
      if (scenario) {
        setActiveScenario(scenario);
        setIsStarted(true);
        setElapsedSeconds(0);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, allScenarios]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCardClick = (id: number) => setSelectedScenarioId(id);

  const handleStart = (scenario?: Scenario) => {
    const chosen = scenario || allScenarios.find((s) => s.id === selectedScenarioId);
    if (!chosen) return;
    setPendingScenario(chosen);
    setSelectedScenarioId(null);
  };

  const handleProfileConfirm = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setActiveScenario(pendingScenario);
    setPendingScenario(null);
    setVoicePromptOpen(true);
  };

  const handleProfileBack = () => {
    setPendingScenario(null);
    setSelectedScenarioId(null);
  };

  const handleVoiceConfirm = async (_enableVoice: boolean) => {
    setVoicePromptOpen(false);
    if (!activeScenario) return;

    try {
      const body: any = { scenario_id: activeScenario.id };
      if (studentProfile) {
        body.personality_key = studentProfile.personality;
        body.grade_id = studentProfile.grade;
      }
      const sessionRes = await api.post("/session/create", body);
      const uuid: string = sessionRes.data.session_uuid;
      setCurrentSessionUuid(uuid);
      setSessionUuid(uuid);
      if (sessionRes.data.student_name) {
        setStudentName(sessionRes.data.student_name);
      }

      const tokenRes = await api.post("/livekit/token", { session_uuid: uuid });
      setLivekitToken(tokenRes.data.token);
    } catch (err) {
      console.error("[Chatroom] Failed to create session or get token:", err);
      alert("無法建立練習，請重新整理頁面後再試。");
      return;
    }

    setIsStarted(true);
    setIsPaused(false);
    setElapsedSeconds(0);
  };

  const handleCloseDetail = () => {
    setSelectedScenarioId(null);
  };

  const handleTogglePause = () => setIsPaused(!isPaused);

  const handleEnd = async () => {
    setIsEnding(true);
    if (currentSessionUuid) {
      try {
        await api.post(`/session/${currentSessionUuid}/end`);
      } catch (err) {
        console.error("[Chatroom] Failed to end session:", err);
      }
    }
    navigate("/feedback", { state: { currentScenarioId: activeScenario?.id } });
  };

  const renderStudentAvatar = () => {
    if (isPaused) return "⏸️";
    switch (studentEmotion) {
      case "angry": return "😤";
      case "sad": return "🥺";
      case "thinking": return "🤔";
      default: return "🧑‍🎓";
    }
  };

  const emotionLabel = () => {
    switch (studentEmotion) {
      case "angry": return "抗拒 · 防衛";
      case "sad": return "難過 · 退縮";
      case "thinking": return "學生思考中...";
      default: return "聆聽中";
    }
  };

  const sessionInfo = isStarted && activeScenario ? {
    scenarioTitle: activeScenario.title,
    formattedTime: formatTime(elapsedSeconds),
    isPaused,
    onTogglePause: handleTogglePause,
    onEnd: handleEnd,
  } : undefined;

  return (
    <AppLayout sessionInfo={sessionInfo}>
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Top Header Toolbar */}
        <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-[#E5E2D9] flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            {isStarted ? (
              <h2 className="text-sm font-bold text-[#3D3831] truncate max-w-[500px]">
                {activeScenario?.title}——<span className="font-normal text-[#706C61]">「{activeScenario?.description}」</span>
              </h2>
            ) : (
              <>
                <Badge variant="outline" className="font-heading text-[10px] font-bold tracking-widest uppercase border-primary/30 text-primary">
                  Growth Map
                </Badge>
                <h2 className="text-sm font-bold text-[#3D3831] truncate max-w-[200px] md:max-w-none">
                  對話成長練習
                </h2>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isStarted && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-[#A09C94]" : "bg-green-500 animate-pulse"}`} />
                <span className="text-sm font-medium text-[#706C61]">
                  {emotionLabel()}
                </span>
              </div>
            )}
            <button
              onClick={() => setHelpOpen(true)}
              className="w-9 h-9 border border-[#E5E2D9] flex items-center justify-center rounded-lg hover:bg-[#FAF9F6] transition-all group"
            >
              <HelpCircle className="w-4.5 h-4.5 text-[#A09C94] group-hover:text-primary transition-colors" />
            </button>
          </div>
        </header>

        {/* Content View Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* BACKGROUND IMAGE */}
          {isStarted && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{ backgroundImage: `url(${classroomBg})` }}
            >
              <div className="absolute inset-0 bg-[#FAF9F6]/10" />
            </div>
          )}

          {/* Student avatar overlay */}
          {isStarted && (
            <div className="absolute top-6 left-8 z-20 flex items-center gap-4 animate-in fade-in duration-500">
              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-white shadow-xl flex items-center justify-center text-3xl">
                {renderStudentAvatar()}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-base font-bold text-white drop-shadow-md">
                  {studentProfile ? `${GRADE_LEVELS.find((g) => g.id === studentProfile.grade)?.label ?? ""}學生` : studentName}
                </span>
                {studentProfile && (
                  <span className="text-[11px] font-bold text-white/90 drop-shadow-sm bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full w-fit">
                    {PERSONALITY_TRAITS.find((p) => p.id === studentProfile.personality)?.emoji}{" "}
                    {PERSONALITY_TRAITS.find((p) => p.id === studentProfile.personality)?.label}
                  </span>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-[#A09C94]" : "bg-primary animate-pulse"}`} />
                  <span className="text-xs font-medium text-white/80 drop-shadow-sm">
                    {emotionLabel()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ENDING OVERLAY */}
          {isEnding && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-white/95 backdrop-blur-md border border-[#E5E2D9] p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-2xl font-bold text-[#3D3831]">分析對話中...</h3>
                  <p className="text-sm text-[#706C61] font-medium leading-relaxed">
                    AI 教練正在評估您的對話表現，<br />請稍候片刻。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {isStarted && isPaused && (
            <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-white/95 backdrop-blur-md border border-[#E5E2D9] p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="w-16 h-16 bg-[#FAF9F6] rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-[#A09C94]" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-2xl font-bold text-[#3D3831]">對話已暫停</h3>
                  <p className="text-sm text-[#706C61] font-medium leading-relaxed">
                    深呼吸，整理一下思緒吧！準備好後點擊下方按鈕繼續練習。
                  </p>
                </div>
                <button
                  onClick={handleTogglePause}
                  className="w-full h-12 bg-primary text-white font-heading font-bold rounded-lg shadow-lg hover:bg-[#C8694F] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  繼續練習
                </button>
              </div>
            </div>
          )}

          {/* 1. SKILL TREE MAP */}
          {!isStarted && !pendingScenario && !selectedScenarioId && (
            <SkillTreeMap
              groups={competencyGroups}
              onSelectScenario={handleCardClick}
              onOpenSoulCards={() => setSoulCardsOpen(true)}
            />
          )}

          {/* 2. DETAIL VIEW */}
          {!isStarted && selectedScenarioId && (() => {
            const found = allScenarios.find((s) => s.id === selectedScenarioId);
            if (!found) return null;
            return (
              <ScenarioDetail
                scenario={found}
                onClose={handleCloseDetail}
                onStart={handleStart}
              />
            );
          })()}

          {/* 2.5 STUDENT PROFILE SELECTION */}
          {!isStarted && pendingScenario && (
            <StudentProfileSelect
              onConfirm={handleProfileConfirm}
              onBack={handleProfileBack}
            />
          )}

          {/* 3. ACTIVE SESSION VIEW */}
          {isStarted && (
            <ChatPanel
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              onEnd={handleEnd}
              onEmotionChange={(emo) => setStudentEmotion(emo as any)}
              livekitToken={livekitToken}
              studentName={studentName}
            />
          )}
        </div>
      </div>

      {/* Soul Cards Overlay */}
      <SoulCards
        scenarios={allScenarios}
        open={soulCardsOpen}
        onClose={() => setSoulCardsOpen(false)}
        onStart={async (scenario) => {
          setSoulCardsOpen(false);
          setActiveScenario(scenario);
          setStudentProfile(null);
          try {
            const sessionRes = await api.post("/session/create", { scenario_id: scenario.id });
            const uuid: string = sessionRes.data.session_uuid;
            setCurrentSessionUuid(uuid);
            setSessionUuid(uuid);
            if (sessionRes.data.student_name) {
              setStudentName(sessionRes.data.student_name);
            }
            const tokenRes = await api.post("/livekit/token", { session_uuid: uuid });
            setLivekitToken(tokenRes.data.token);
          } catch (err) {
            console.error("[Chatroom] SoulCards session create failed:", err);
            alert("無法建立練習，請重新整理頁面後再試。");
            return;
          }
          setIsStarted(true);
          setIsPaused(false);
          setElapsedSeconds(0);
        }}
      />

      {/* Voice Prompt Dialog */}
      <Dialog open={voicePromptOpen} onOpenChange={setVoicePromptOpen}>
        <DialogContent className="sm:max-w-sm border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-8 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-xl font-bold text-[#3D3831]">開啟語音功能？</h3>
              <p className="text-sm text-[#706C61] font-medium leading-relaxed">
                語音模式可讓您用口說方式與 AI 學生互動，體驗更真實的對話練習。
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleVoiceConfirm(false)}
                className="flex-1 h-11 border-2 border-[#E5E2D9] rounded-xl font-heading text-sm font-bold text-[#706C61] hover:bg-[#FAF9F6] transition-all"
              >
                僅用文字
              </button>
              <button
                onClick={() => handleVoiceConfirm(true)}
                className="flex-1 h-11 bg-primary text-white rounded-xl font-heading text-sm font-bold shadow-lg hover:bg-[#C8694F] transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                開啟語音
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-[#3D3831] p-6 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">對話練習指南</h2>
              <p className="text-xs text-white/60 font-medium">Safe Harbor & Consistent Communication</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              {[
                { id: 1, text: "選擇情境：從成長地圖中挑選一個感興趣或想精進的對話挑戰，或抽取隨機牌卡。" },
                { id: 2, text: "設定學生：選擇學生個性與年級，打造更真實的對話情境。" },
                { id: 3, text: "模擬互動：使用語音或文字，像平常對話一樣與 AI 學生互動。" },
                { id: 4, text: "覺察情緒：觀察學生的表情與情緒標籤，調整您的溝通姿態。" },
                { id: 5, text: "專家回饋：結束後查看雷達圖指標，學習「一致性」的表達方式。" },
              ].map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <span className="w-6 h-6 shrink-0 bg-[#FAF9F6] border border-[#E5E2D9] rounded-full flex items-center justify-center text-[10px] font-bold text-[#706C61] group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                    {item.id}
                  </span>
                  <p className="text-sm text-[#706C61] font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setHelpOpen(false)}
              className="w-full h-12 border-2 border-[#3D3831] text-[#3D3831] font-heading font-bold rounded-lg hover:bg-[#3D3831] hover:text-white transition-all uppercase tracking-widest text-xs"
            >
              我知道了
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
