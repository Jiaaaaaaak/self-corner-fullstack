import { useState, useRef, useEffect } from "react";
import { Mic, Send, Pause, Play, SquareSquare, Disc2, Loader2 } from "lucide-react";
import { Room, RoomEvent, Track, DataPacket_Kind } from "livekit-client";

interface ChatMessage {
  role: "teacher" | "student";
  content: string;
}

interface ChatPanelProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  onEmotionChange?: (emotion: string) => void;
  livekitToken: string | null;
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? "ws://localhost:7880";

export default function ChatPanel({ isPaused, onTogglePause, onEnd, onEmotionChange, livekitToken }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // Connect to LiveKit
  useEffect(() => {
    if (!livekitToken) return;

    const room = new Room();
    roomRef.current = room;

    // Handle remote audio tracks (student voice)
    room.on(RoomEvent.TrackSubscribed, (track, _publication, _participant) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach() as HTMLAudioElement;
        el.autoplay = true;
        document.body.appendChild(el);
        audioElementsRef.current.push(el);
      }
    });

    // Handle data messages from agent (transcripts)
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, _participant, _kind) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "agent_response" && msg.text) {
          setIsThinking(false);
          setMessages((prev) => [...prev, { role: "student", content: msg.text }]);
          if (onEmotionChange) onEmotionChange("neutral");
        } else if (msg.type === "user_transcription" && msg.text) {
          setMessages((prev) => [...prev, { role: "teacher", content: msg.text }]);
          setIsThinking(true);
          if (onEmotionChange) onEmotionChange("thinking");
        }
      } catch {
        // ignore malformed messages
      }
    });

    // Scan existing tracks (agent might already be in room)
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      participant.trackPublications.forEach((pub) => {
        if (pub.track && pub.track.kind === Track.Kind.Audio) {
          const el = pub.track.attach() as HTMLAudioElement;
          el.autoplay = true;
          document.body.appendChild(el);
          audioElementsRef.current.push(el);
        }
      });
    });

    room.connect(LIVEKIT_URL, livekitToken, {
      autoSubscribe: true,
    }).then(() => {
      // Unlock audio context on connect
      room.startAudio();
    }).catch((err) => {
      console.error("[ChatPanel] LiveKit connect failed:", err);
    });

    return () => {
      room.disconnect();
      audioElementsRef.current.forEach((el) => {
        el.pause();
        el.remove();
      });
      audioElementsRef.current = [];
    };
  }, [livekitToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isThinking || isPaused) return;

    setMessages((prev) => [...prev, { role: "teacher", content: text }]);
    setInputText("");
    setIsThinking(true);
    if (onEmotionChange) onEmotionChange("thinking");

    if (roomRef.current) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: "teacher_text_input", text })
        );
        await roomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (err) {
        console.error("[ChatPanel] Failed to send text:", err);
        setIsThinking(false);
      }
    } else {
      // No LiveKit connection — simulate response after delay
      setTimeout(() => {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          { role: "student", content: "（尚未連線，請確認後端服務是否啟動）" },
        ]);
        if (onEmotionChange) onEmotionChange("neutral");
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = async () => {
    if (!roomRef.current) return;
    if (isRecording) {
      // Stop publishing mic
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      setIsRecording(false);
    } else {
      // Start publishing mic
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        setIsRecording(true);
        if (onEmotionChange) onEmotionChange("thinking");
      } catch (err) {
        console.error("[ChatPanel] Mic enable failed:", err);
      }
    }
  };

  // Only show recent messages to preserve screen space
  const visibleMessages = messages.slice(-3);

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col z-30">
      {/* Chat messages - transparent, minimal, only recent */}
      <div className="px-8 py-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {visibleMessages.map((msg, i) => (
            <div
              key={messages.length - visibleMessages.length + i}
              className={`flex ${msg.role === "teacher" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {msg.role === "student" && (
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#E5E2D9]/50 flex items-center justify-center shrink-0 mr-2.5 self-end shadow-sm">
                  <span className="text-[10px] font-bold text-[#706C61]">小</span>
                </div>
              )}
              <div
                className={`max-w-[65%] px-5 py-3 text-[15px] font-medium leading-relaxed shadow-lg ${
                  msg.role === "teacher"
                    ? "bg-primary/90 backdrop-blur-sm text-white rounded-[18px] rounded-tr-sm"
                    : "bg-white/85 backdrop-blur-sm text-[#3D3831] rounded-[18px] rounded-tl-sm border border-white/50"
                }`}
              >
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#E5E2D9]/50 flex items-center justify-center shrink-0 mr-2.5 self-end shadow-sm">
                <Loader2 className="w-3.5 h-3.5 text-[#706C61] animate-spin" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-white/50 px-5 py-3 rounded-[18px] rounded-tl-sm shadow-lg">
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

      {/* Input bar */}
      <div className="px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Text input - takes most space */}
          <div className="flex-1 flex items-center h-12 px-5 bg-white/80 backdrop-blur-md border border-white/50 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "正在聆聽您的聲音..." : "輸入文字回應..."}
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-[#A09C94] text-[#3D3831] font-medium"
              disabled={isPaused || isRecording}
            />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={toggleRecording}
              disabled={isPaused}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-95 ${
                isRecording
                  ? "bg-destructive text-white ring-4 ring-destructive/20 animate-pulse"
                  : "bg-primary text-white hover:bg-primary/90 hover:scale-105"
              } disabled:opacity-50`}
            >
              {isRecording ? <Disc2 className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isPaused}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-white/50 text-[#3D3831] hover:text-primary hover:scale-105 transition-all shadow-lg disabled:opacity-40 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Pause button */}
            <button
              onClick={onTogglePause}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-white/50 text-[#706C61] hover:text-primary transition-all shadow-lg hover:scale-105 active:scale-95"
              title={isPaused ? "繼續練習" : "暫停練習"}
            >
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
            </button>

            {/* End button */}
            <button
              onClick={onEnd}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-white/50 text-[#706C61] hover:text-destructive transition-all shadow-lg hover:scale-105 active:scale-95"
              title="結束對話"
            >
              <SquareSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
