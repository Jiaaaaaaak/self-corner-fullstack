import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Pause, Play, LogOut, Loader2 } from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";

interface ChatMessage {
  role: "teacher" | "student";
  content: string;
}

interface ChatPanelProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  livekitToken: string | null;
  livekitUrl: string | null;
  isEnding?: boolean;
}

export default function ChatPanel({
  isPaused,
  onTogglePause,
  onEnd,
  livekitToken,
  livekitUrl,
  isEnding = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [micOn, setMicOn] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // =========================================================================
  // LiveKit 連線
  // =========================================================================
  useEffect(() => {
    if (!livekitToken || !livekitUrl) return;

    const room = new Room();
    roomRef.current = room;

    // 監聽資料頻道（接收學生回應 & 老師逐字稿）
    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text) as { type: string; text?: string };

        if (data.type === "agent_response" && data.text) {
          setMessages((prev) => [...prev, { role: "student", content: data.text! }]);
        } else if (data.type === "user_transcription" && data.text) {
          setMessages((prev) => [...prev, { role: "teacher", content: data.text! }]);
        }
      } catch {
        // 忽略非 JSON 資料
      }
    });

    // 播放遠端音訊（學生語音）
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        console.log("[LiveKit] Remote audio track subscribed from:", participant.identity);
        const el = track.attach() as HTMLAudioElement;
        el.autoplay = true;
        document.body.appendChild(el);
        audioElementsRef.current.push(el);
      }
    });

    room.connect(livekitUrl, livekitToken).then(async () => {
      console.log("[LiveKit] Connected to room:", room.name);
      try {
        // 初始啟用麥克風（必須在 connect 後才能呼叫）
        await room.localParticipant.setMicrophoneEnabled(true);
        // 確保瀏覽器允許播放遠端音訊（學生語音）
        await room.startAudio();
      } catch (err) {
        console.error("[LiveKit] Audio setup failed:", err);
      }
    }).catch((err) => {
      console.error("[LiveKit] Connection failed:", err);
    });

    return () => {
      audioElementsRef.current.forEach((el) => {
        el.pause();
        el.srcObject = null;
        el.remove();
      });
      audioElementsRef.current = [];
      room.disconnect();
    };
  }, [livekitToken, livekitUrl]);

  // 麥克風開關
  useEffect(() => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.setMicrophoneEnabled(micOn && !isPaused);
  }, [micOn, isPaused]);

  // =========================================================================
  // 訊息自動捲動
  // =========================================================================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================================================================
  // 文字傳送（透過 LiveKit data channel 送給 agent，觸發 AI 學生語音回應）
  // =========================================================================
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "teacher", content: text }]);
    setInputText("");

    if (roomRef.current) {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "teacher_text_input", text })
      );
      await roomRef.current.localParticipant.publishData(payload, { reliable: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-background/70 backdrop-blur-md border-t border-border/50 flex flex-col p-3 gap-2">
      {/* Chat messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "teacher" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "teacher"
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {msg.role === "teacher" ? "👩‍🏫 老師" : "🧑‍🎓 學生"}
                </span>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入文字回應..."
          className="flex-1"
          disabled={isPaused}
        />

        {/* Mic toggle */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          onClick={() => setMicOn(!micOn)}
          title={micOn ? "關閉麥克風" : "開啟麥克風"}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        {/* Send */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          onClick={handleSend}
          disabled={!inputText.trim() || isPaused}
          title="傳送"
        >
          <Send className="h-4 w-4" />
        </Button>

        {/* Pause/Resume */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          onClick={onTogglePause}
          title={isPaused ? "繼續" : "暫停"}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        {/* End */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          onClick={onEnd}
          disabled={isEnding}
          title={isEnding ? "產生回饋中..." : "結束對話"}
        >
          {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
