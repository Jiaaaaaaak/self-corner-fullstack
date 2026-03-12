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
  characterName?: string;
}

export default function ChatPanel({ isPaused, onTogglePause, onEnd, onEmotionChange, voiceEnabled = false, personalityId, gradeId, characterName }: ChatPanelProps) {
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

  const studentName = characterName || "學生";

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col z-30">
      {/* Chat messages - RPG dialogue style */}
      <div className="px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="max-h-[22vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/60">
            <div className="flex flex-col gap-2.5">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === "teacher" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.role === "student" ? (
                    /* RPG-style dialogue box for student */
                    <div className="max-w-[75%]">
                      <div className="bg-[#3D3831]/80 backdrop-blur-md rounded-2xl rounded-bl-sm px-4 py-3 shadow-xl border border-white/10">
                        {/* Student name label */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-primary tracking-wide">
                            {studentName}
                          </span>
                          <div className="flex-1 h-px bg-white/10" />
                        </div>
                        <p className="text-[14px] font-medium leading-relaxed text-white/90">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Teacher bubble */
                    <div
                      className="max-w-[65%] px-4 py-2.5 text-[14px] font-medium leading-relaxed shadow-lg bg-primary/85 backdrop-blur-sm text-white rounded-2xl rounded-tr-sm"
                    >
                      <p>{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="max-w-[75%]">
                    <div className="bg-[#3D3831]/80 backdrop-blur-md rounded-2xl rounded-bl-sm px-4 py-3 shadow-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-primary tracking-wide">
                          {studentName}
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                      <div className="flex gap-1.5 py-0.5">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                      </div>
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
      <div className="px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center h-11 px-4 bg-[#3D3831]/50 backdrop-blur-md border border-white/15 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "正在聆聽您的聲音..." : "輸入文字回應..."}
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-white/40 text-white font-medium"
              disabled={isPaused || isRecording}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              disabled={isPaused}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-95 relative ${
                isRecording
                  ? "bg-destructive text-white"
                  : "bg-[#3D3831]/60 backdrop-blur-sm text-white/70 hover:bg-[#3D3831]/80 hover:text-white hover:scale-105 border border-white/10"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                  <span className="absolute inset-[-4px] rounded-full border-2 border-destructive/30 animate-pulse" />
                  <Mic className="w-4.5 h-4.5 relative z-10" />
                </>
              ) : (
                <MicOff className="w-4.5 h-4.5" />
              )}
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isPaused}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-primary/80 backdrop-blur-sm border border-primary/30 text-white hover:bg-primary hover:scale-105 transition-all shadow-lg disabled:opacity-40 active:scale-95"
            >
              <Send className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={onTogglePause}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#3D3831]/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95"
              title={isPaused ? "繼續練習" : "暫停練習"}
            >
              {isPaused ? <Play className="w-4.5 h-4.5 fill-current" /> : <Pause className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={onEnd}
              className="h-11 px-4 rounded-full flex items-center justify-center gap-2 bg-[#3D3831]/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:border-primary/30 transition-all shadow-lg hover:scale-105 active:scale-95"
              title="結束對話並分析"
            >
              <ClipboardCheck className="w-4.5 h-4.5" />
              <span className="text-xs font-bold">結束並分析</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}