import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import classroomBg from "@/assets/classroom-background.png";
import {
  Dices,
  HelpCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Mic,
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ScenarioCard from "@/components/chatroom/ScenarioCard";
import ScenarioDetail from "@/components/chatroom/ScenarioDetail";
import RandomConfirm from "@/components/chatroom/RandomConfirm";
import ChatPanel from "@/components/chatroom/ChatPanel";

const allScenarios = [
  { id: 1, title: "考場失利後的自責", tag: "自我覺察", emoji: "📝", description: "學生在一次重要考試中表現不佳，感到極度自責和沮喪。他開始質疑自己的能力，甚至不想再上學。" },
  { id: 2, title: "分組被落單的窘迫", tag: "社會覺察", emoji: "👥", description: "班上分組活動時，有一位學生總是最後一個被選或直接被遺漏。他表面上裝作無所謂，但內心其實很受傷。" },
  { id: 3, title: "被當眾誤解的憤怒", tag: "自我管理", emoji: "😤", description: "學生在課堂上被同學誤解並當眾指責，他非常憤怒，差點失控動手。你需要幫助他冷靜下來。" },
  { id: 4, title: "好朋友吵架的糾結", tag: "人際技巧", emoji: "🤝", description: "兩個好朋友因為一件小事吵架了，其中一位來找你傾訴。他既想和好，又覺得委屈。引導他學習溝通技巧。" },
  { id: 5, title: "面對新環境的焦慮", tag: "自我覺察", emoji: "🌱", description: "學生剛轉學到新班級，對陌生的環境和同學感到極度焦慮。他不敢主動交朋友，午餐時間總是一個人。" },
  { id: 6, title: "承認作弊後的羞愧", tag: "負責決策", emoji: "💭", description: "學生在考試中作弊被發現，他感到非常羞愧，不知道如何面對老師和同學。引導他理解誠實的重要性。" },
];

const DISPLAY_COUNT = 6;
const TAGS = ["全部", "自我覺察", "自我管理", "社會覺察", "人際技巧", "負責決策"];

function pickRandomScenarios(pool: typeof allScenarios, count: number) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function Chatroom() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [studentEmotion, setStudentEmotion] = useState<"neutral" | "angry" | "sad" | "thinking">("neutral");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<(typeof allScenarios)[0] | null>(null);
  const [activeTag, setActiveTag] = useState("全部");
  const [showRandomConfirm, setShowRandomConfirm] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);
  const [displayedScenarios, setDisplayedScenarios] = useState(() =>
    pickRandomScenarios(allScenarios, DISPLAY_COUNT)
  );

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
    if (retryId) {
      const scenario = allScenarios.find(s => s.id === retryId);
      if (scenario) {
        setActiveScenario(scenario);
        setIsStarted(true);
        setElapsedSeconds(0);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCardClick = (id: number) => setSelectedScenarioId(id);
  const handleRandomClick = () => setShowRandomConfirm(true);
  const handleRefresh = () => setDisplayedScenarios(pickRandomScenarios(allScenarios, DISPLAY_COUNT));

  const handleStart = (scenario?: (typeof allScenarios)[0]) => {
    const chosen = scenario || allScenarios.find(s => s.id === selectedScenarioId) || pickRandomScenarios(allScenarios, 1)[0];
    setActiveScenario(chosen);
    setSelectedScenarioId(null);
    setShowRandomConfirm(false);
    // Show voice prompt before starting
    setVoicePromptOpen(true);
  };

  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const handleVoiceConfirm = (enableVoice: boolean) => {
    setVoicePromptOpen(false);
    setVoiceEnabled(enableVoice);
    setIsStarted(true);
    setIsPaused(false);
    setElapsedSeconds(0);
  };

  const handleCloseDetail = () => {
    setSelectedScenarioId(null);
    setShowRandomConfirm(false);
  };

  const handleTogglePause = () => setIsPaused(!isPaused);
  const handleEnd = () => navigate("/feedback", { state: { currentScenarioId: activeScenario?.id } });

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

  // Pass session info to sidebar via AppLayout
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
                   Scenario Selection
                 </Badge>
                 <h2 className="text-sm font-bold text-[#3D3831] truncate max-w-[200px] md:max-w-none">
                   探索練習情境
                 </h2>
               </>
             )}
          </div>
          
          <div className="flex items-center gap-4">
             {/* Emotion status indicator */}
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

          {/* Student avatar overlay - top left area */}
          {isStarted && (
            <div className="absolute top-6 left-8 z-20 flex items-center gap-4 animate-in fade-in duration-500">
              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-white shadow-xl flex items-center justify-center text-3xl">
                {renderStudentAvatar()}
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold text-white drop-shadow-md">
                  小明（國二）
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-[#A09C94]" : "bg-primary animate-pulse"}`} />
                  <span className="text-xs font-medium text-white/80 drop-shadow-sm">
                    {emotionLabel()}
                  </span>
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

          {/* 1. SCENARIO SELECTION VIEW */}
          {!isStarted && !selectedScenarioId && !showRandomConfirm && (
            <div className="h-full overflow-y-auto px-6 py-10 md:px-12 animate-in fade-in duration-500 bg-[#FAF9F6]">
               <div className="max-w-5xl mx-auto flex flex-col gap-10">
                 <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Scenario Pool</span>
                        <h3 className="font-heading text-2xl font-bold text-[#3D3831]">選擇一個練習情境</h3>
                      </div>
                      <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 border border-[#E5E2D9] rounded-lg text-sm font-bold text-[#706C61] hover:bg-white hover:text-primary transition-all group shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        換一批
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className={`px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide transition-all ${
                            activeTag === tag 
                            ? "bg-[#3D3831] text-white shadow-md" 
                            : "bg-white border border-[#E5E2D9] text-[#706C61] hover:border-[#3D3831]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedScenarios.map((scenario) => (
                      <ScenarioCard key={scenario.id} scenario={scenario} onClick={handleCardClick} />
                    ))}
                    <button
                      onClick={handleRandomClick}
                      className="group flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-white hover:border-primary hover:bg-primary/5 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dices className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-heading text-lg font-bold text-[#3D3831]">隨機挑戰</span>
                        <p className="text-xs text-[#706C61] font-medium leading-relaxed">
                          由系統隨機挑選一個<br/>未知情境進行練習
                        </p>
                      </div>
                    </button>
                 </div>
               </div>
            </div>
          )}

          {/* 2. DETAIL / CONFIRM VIEWS */}
          {!isStarted && selectedScenarioId && (
            <ScenarioDetail 
              scenario={allScenarios.find(s => s.id === selectedScenarioId)!} 
              onClose={handleCloseDetail} 
              onStart={handleStart} 
            />
          )}
          {!isStarted && showRandomConfirm && (
            <RandomConfirm onClose={handleCloseDetail} onStart={() => handleStart()} />
          )}

          {/* 3. ACTIVE SESSION VIEW - just ChatPanel over background */}
          {isStarted && (
            <ChatPanel
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              onEnd={handleEnd}
              onEmotionChange={(emo) => setStudentEmotion(emo as any)}
              voiceEnabled={voiceEnabled}
            />
          )}
        </div>
      </div>

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
                 { id: 1, text: "選擇情境：從情境池中挑選一個感興趣或想精進的對話挑戰。" },
                 { id: 2, text: "模擬互動：使用語音或文字，像平常對話一樣與 AI 學生互動。" },
                 { id: 3, text: "覺察情緒：觀察學生的表情與情緒標籤，調整您的溝通姿態。" },
                 { id: 4, text: "暫停反思：若感到壓力或不知如何回應，隨時按暫停深呼吸。" },
                 { id: 5, text: "專家回饋：結束後查看雷達圖指標，學習「一致性」的表達方式。" }
               ].map(item => (
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
