import { useState, useEffect, useRef } from "react";
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
import StudentProfileSelect, { type StudentProfile } from "@/components/chatroom/StudentProfileSelect";
import { buildCompetencyGroups, type Scenario, type CompetencyGroup } from "@/lib/collectionData";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { getStudentImagePath, getAvatarPath, preloadCharacterImages, type StudentEmotion } from "@/lib/studentCharacter";

export default function Chatroom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionUuid } = useAuthStore();

  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [competencyGroups, setCompetencyGroups] = useState<CompetencyGroup[]>([]);
  const [allPersonalities, setAllPersonalities] = useState<any[]>([]);
  const [allGradeLevels, setAllGradeLevels] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [studentEmotion, setStudentEmotion] = useState<StudentEmotion>("neutral");
  const [displayedEmotion, setDisplayedEmotion] = useState<StudentEmotion>("neutral");
  const [isTransitioning, setIsTransitioning] = useState(false);
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
  const [enableVoice, setEnableVoice] = useState(false);
  const [isRetrying, setIsRetrying] = useState(!!location.state?.retryScenarioId);

  // Refs for unmount cleanup (避免 stale closure 問題)
  const currentSessionUuidRef = useRef<string | null>(null);
  const isStartedRef = useRef(false);
  const isEndingRef = useRef(false);

  useEffect(() => { currentSessionUuidRef.current = currentSessionUuid; }, [currentSessionUuid]);
  useEffect(() => { isStartedRef.current = isStarted; }, [isStarted]);
  useEffect(() => { isEndingRef.current = isEnding; }, [isEnding]);

  // 離開頁面時若 session 仍 active 且非正常結束，呼叫 abandon
  useEffect(() => {
    return () => {
      const uuid = currentSessionUuidRef.current;
      if (isStartedRef.current && !isEndingRef.current && uuid) {
        api.post(`/session/${uuid}/abandon`).catch(() => {});
      }
    };
  }, []);

  // Cross-fade emotion transition
  useEffect(() => {
    if (studentEmotion !== displayedEmotion) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedEmotion(studentEmotion);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [studentEmotion, displayedEmotion]);

  // Load scenarios from API
  useEffect(() => {
    api.get("/scenarios").then((res) => {
      const data: Scenario[] = res.data.map((s: any) => ({
        id: s.id,
        title: s.title,
        tag: s.sel_category ?? "自我覺察",
        emoji: s.emoji ?? "📝",
        description: s.description ?? "",
        short_desc: s.short_desc ?? undefined,
        tags: s.tags ?? [],
        practice_count: s.practice_count ?? 0,
        estimated_minutes: s.estimated_minutes ?? 10,
      }));
      setAllScenarios(data);
      setCompetencyGroups(buildCompetencyGroups(data));
    }).catch(() => {});

    api.get("/personalities").then((res) => {
      setAllPersonalities(res.data);
    }).catch(() => {});

    api.get("/grade-levels").then((res) => {
      setAllGradeLevels(res.data);
    }).catch(() => {});
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

  // 建立 Session 並取得 LiveKit Token（抽出供正常流程與重試共用）
  const doStartSession = async (
    scenario: Scenario,
    personalityKey: string | null,
    gradeId: string | null,
  ) => {
    const body: any = { scenario_id: scenario.id };
    if (personalityKey) body.personality_key = personalityKey;
    if (gradeId) body.grade_id = gradeId;

    const sessionRes = await api.post("/session/create", body);
    const uuid: string = sessionRes.data.session_uuid;
    setCurrentSessionUuid(uuid);
    setSessionUuid(uuid);
    if (sessionRes.data.student_name) {
      const name: string = sessionRes.data.student_name;
      setStudentName(name);
      preloadCharacterImages(name);
    }
    if (sessionRes.data.initial_emotion) {
      const initEmo = sessionRes.data.initial_emotion as StudentEmotion;
      setStudentEmotion(initEmo);
      setDisplayedEmotion(initEmo);
    }
    const tokenRes = await api.post("/livekit/token", { session_uuid: uuid });
    setLivekitToken(tokenRes.data.token);
  };

  // Handle Retry logic（直接帶入前次設定，跳過選擇流程）
  useEffect(() => {
    const retryId = location.state?.retryScenarioId;
    if (!retryId || allScenarios.length === 0) return;

    const scenario = allScenarios.find((s) => s.id === retryId);
    if (!scenario) return;

    window.history.replaceState({}, document.title);
    setActiveScenario(scenario);
    const personalityKey = location.state?.retryPersonalityKey ?? null;
    const gradeId = location.state?.retryGradeId ?? null;
    const voiceEnabled = location.state?.retryEnableVoice ?? false;
    setEnableVoice(voiceEnabled);

    doStartSession(scenario, personalityKey, gradeId)
      .then(() => {
        setIsStarted(true);
        setIsPaused(false);
        setElapsedSeconds(0);
      })
      .catch((err) => {
        console.error("[Chatroom] Retry session creation failed:", err);
        alert("無法建立練習，請重新整理頁面後再試。");
      })
      .finally(() => setIsRetrying(false));
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

  const handleProfileConfirm = async (profile: StudentProfile) => {
    setStudentProfile(profile);
    const scenario = pendingScenario!;
    setActiveScenario(scenario);
    setPendingScenario(null);
    setIsStarted(true);        // 先切換到對話頁面作為背景
    setIsPaused(false);
    setElapsedSeconds(0);
    setVoicePromptOpen(true);  // 語音選擇 dialog 疊在對話頁面上
    try {
      await doStartSession(
        scenario,
        profile.personality ?? null,
        profile.grade ?? null,
      );
    } catch (err) {
      console.error("[Chatroom] Failed to create session:", err);
      setIsStarted(false);
      setVoicePromptOpen(false);
      setActiveScenario(null);
      alert("無法建立練習，請重新整理頁面後再試。");
    }
  };

  const handleProfileBack = () => {
    setPendingScenario(null);
    setSelectedScenarioId(null);
  };

  const handleVoiceConfirm = (voiceEnabled: boolean) => {
    setEnableVoice(voiceEnabled);
    setVoicePromptOpen(false);
  };

  const handlePipelineError = async () => {
    const uuid = currentSessionUuid;
    // 先重設狀態讓 UI 回到選擇畫面，避免使用者看到空白的聊天室
    setIsStarted(false);
    setIsEnding(false);
    setActiveScenario(null);
    setLivekitToken(null);
    setCurrentSessionUuid(null);
    setElapsedSeconds(0);
    setStudentEmotion("neutral");
    setDisplayedEmotion("neutral");
    // 清理 session
    if (uuid) {
      api.post(`/session/${uuid}/abandon`).catch(() => {});
    }
    alert("系統無法載入對話設定（可能是資料庫連線問題），請重新選擇情境再試一次。");
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
    navigate("/feedback", {
      state: {
        currentScenarioId: activeScenario?.id,
        retryPersonalityKey: studentProfile?.personality ?? null,
        retryGradeId: studentProfile?.grade ?? null,
        retryEnableVoice: enableVoice,
      },
    });
  };

  const emotionLabel = () => {
    const labels: Record<string, string> = {
      angry: "抗拒 · 防衛",
      sad: "難過 · 退縮",
      thinking: "學生思考中...",
      frustrated: "挫折 · 受傷",
      anxious: "焦慮 · 不安",
      confident: "自信 · 穩定",
      happy: "開心 · 放鬆",
      surprised: "驚訝 · 意外",
      neutral: "聆聽中",
    };
    return labels[studentEmotion] ?? "聆聽中";
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
                {activeScenario?.title}——<span className="font-normal text-[#706C61]">「{activeScenario?.short_desc ?? activeScenario?.description}」</span>
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

          {/* RPG Character Display */}
          {isStarted && (
            <>
              {/* Large character illustration - anchored at bottom center */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-[85vh] overflow-hidden flex items-start justify-center pointer-events-none">
                <img
                  key={studentName}
                  src={getStudentImagePath(studentName, displayedEmotion)}
                  alt={`${studentName} - ${displayedEmotion}`}
                  className={`h-[110vh] object-contain object-top drop-shadow-2xl transition-all duration-300 ease-out ${
                    isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  } ${isPaused ? "brightness-50" : ""}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>

              {/* Student info badge - top left */}
              <div className="absolute top-4 left-6 z-20 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-2xl px-3 py-2" style={{ textShadow: "0 1px 3px rgba(255,255,255,0.8)" }}>
                  {/* Avatar thumbnail - static, from /avatars/ */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-lg shrink-0 bg-white/90">
                    <img
                      key={studentName}
                      src={getAvatarPath(studentName)}
                      alt={studentName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-heading text-sm font-bold text-[#3D3831] drop-shadow-sm">
                      {studentName}
                    </span>
                    {studentProfile && (
                      <span className="text-xs font-medium text-[#706C61] drop-shadow-sm">
                        {allGradeLevels.find((g) => g.id === studentProfile.grade)?.label ?? ""}・{studentProfile.personality}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-[#A09C94]" : "bg-green-500 animate-pulse"}`} />
                      <span className="text-[11px] font-medium text-[#706C61] drop-shadow-sm">
                        {emotionLabel()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
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

          {/* RETRY LOADING */}
          {isRetrying && !isStarted && (
            <div className="absolute inset-0 z-50 bg-[#FAF9F6] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-[#706C61]">正在載入上次的情境設定...</p>
              </div>
            </div>
          )}

          {/* 1. SKILL TREE MAP */}
          {!isStarted && !isRetrying && !pendingScenario && !selectedScenarioId && (
            <SkillTreeMap
              groups={competencyGroups}
              onSelectScenario={handleCardClick}
              onOpenSoulCards={() => setSoulCardsOpen(true)}
            />
          )}

          {/* 2. DETAIL VIEW */}
          {!isStarted && !isRetrying && selectedScenarioId && (() => {
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
          {!isStarted && !isRetrying && pendingScenario && (
            <StudentProfileSelect
              onConfirm={handleProfileConfirm}
              onBack={handleProfileBack}
              allowedPersonalityTags={pendingScenario?.tags}
              personalities={allPersonalities}
              gradeLevels={allGradeLevels}
            />
          )}

          {/* 3. ACTIVE SESSION VIEW */}
          {isStarted && (
            <ChatPanel
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              onEnd={handleEnd}
              onEmotionChange={(emo) => setStudentEmotion(emo as StudentEmotion)}
              onPipelineError={handlePipelineError}
              enableVoice={enableVoice}
              livekitToken={livekitToken}
              studentName={studentName}
              sessionUuid={currentSessionUuid}
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
              const name: string = sessionRes.data.student_name;
              setStudentName(name);
              preloadCharacterImages(name);
            }
            if (sessionRes.data.initial_emotion) {
              const initEmo = sessionRes.data.initial_emotion as StudentEmotion;
              setStudentEmotion(initEmo);
              setDisplayedEmotion(initEmo);
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

      {/* Voice Prompt Dialog — 不可關閉，確保使用者必須做出選擇 */}
      <Dialog open={voicePromptOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-sm border-none p-0 overflow-hidden rounded-2xl shadow-2xl [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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
