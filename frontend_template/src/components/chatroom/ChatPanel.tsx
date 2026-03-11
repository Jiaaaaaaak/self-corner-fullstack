import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Pause, Play, Loader2, ClipboardCheck } from "lucide-react";
import { getPersonalityConfig, getTextForGrade } from "@/lib/studentPersonality";

interface ChatMessage {
  role: "teacher" | "student";
  content: string;
}

interface ChatPanelProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  onEmotionChange?: (emotion: string) => void;
  voiceEnabled?: boolean;
  personalityId?: string;
  gradeId?: string;
}

export default function ChatPanel({ isPaused, onTogglePause, onEnd, onEmotionChange, voiceEnabled = false, personalityId, gradeId }: ChatPanelProps) {
  const config = personalityId ? getPersonalityConfig(personalityId) : null;
  const grade = gradeId ?? "upper-elementary";
  const responseIndexRef = useRef(0);

  const initialMessage = config
    ? getTextForGrade(config.initialMessage, grade)
    : "老師......我有點不想說，但我今天心情真的很差。";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "student", content: initialMessage },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(voiceEnabled);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    
    const newMsg: ChatMessage = { role: "teacher", content: inputText.trim() };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsThinking(true);
    if (onEmotionChange) onEmotionChange("thinking");

    setTimeout(() => {
      setIsThinking(false);

      let replyContent: string;
      let replyEmotion: string;

      if (config) {
        const idx = responseIndexRef.current % config.responses.length;
        const response = config.responses[idx];
        replyContent = getTextForGrade(response.content, grade);
        replyEmotion = response.emotion;
        responseIndexRef.current += 1;
      } else {
        replyContent = "我覺得大家都針對我，反正我做什麼都不對！";
        replyEmotion = "angry";
      }

      setMessages((prev) => [
        ...prev,
        { role: "student", content: replyContent },
      ]);
      if (onEmotionChange) onEmotionChange(replyEmotion);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording && onEmotionChange) onEmotionChange("neutral");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col z-30">
      {/* Chat messages - scrollable, limited to 25vh */}
      <div className="px-8 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="max-h-[18vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/60">
            <div className="flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === "teacher" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.role === "student" && (
                    <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-[#E5E2D9]/50 flex items-center justify-center shrink-0 mr-2 self-end shadow-sm">
                      <span className="text-[10px] font-bold text-[#706C61]">小</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[65%] px-3 py-1.5 text-[14px] font-medium leading-relaxed shadow-md ${
                      msg.role === "teacher"
                        ? "bg-primary/70 backdrop-blur-sm text-white rounded-[16px] rounded-tr-sm"
                        : "bg-white/60 backdrop-blur-sm text-[#3D3831] rounded-[16px] rounded-tl-sm border border-white/30"
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-[#E5E2D9]/50 flex items-center justify-center shrink-0 mr-2 self-end shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 text-[#706C61] animate-spin" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-white/50 px-4 py-2 rounded-[16px] rounded-tl-sm shadow-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#A09C94] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-[#A09C94] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-[#A09C94] rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center h-11 px-4 bg-white/50 backdrop-blur-md border border-white/30 rounded-full shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "正在聆聽您的聲音..." : "輸入文字回應..."}
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-[#A09C94] text-[#3D3831] font-medium"
              disabled={isPaused || isRecording}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              disabled={isPaused}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-95 relative ${
                isRecording
                  ? "bg-destructive text-white"
                  : "bg-[#3D3831]/60 backdrop-blur-sm text-white/70 hover:bg-[#3D3831]/80 hover:text-white hover:scale-105"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                  <span className="absolute inset-[-4px] rounded-full border-2 border-destructive/30 animate-pulse" />
                  <Mic className="w-5 h-5 relative z-10" />
                </>
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isPaused}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-white/50 text-[#3D3831] hover:text-primary hover:scale-105 transition-all shadow-lg disabled:opacity-40 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>

            <button
              onClick={onTogglePause}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-white/50 text-[#706C61] hover:text-primary transition-all shadow-lg hover:scale-105 active:scale-95"
              title={isPaused ? "繼續練習" : "暫停練習"}
            >
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
            </button>

            <button
              onClick={onEnd}
              className="h-12 px-5 rounded-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm border border-white/50 text-[#706C61] hover:text-primary hover:border-primary/30 transition-all shadow-lg hover:scale-105 active:scale-95"
              title="結束對話並分析"
            >
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs font-bold">結束並分析</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
