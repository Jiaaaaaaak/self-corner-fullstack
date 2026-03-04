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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { ArrowRight, Lightbulb, Sparkles, RefreshCw, Share2, MessageSquare, MessageCircle, Activity, PlusCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";

const radarData = [
  { subject: "自我覺察", value: 92 },
  { subject: "一致性表達", value: 75 },
  { subject: "社會覺察", value: 65 },
  { subject: "同理心連結", value: 80 },
  { subject: "情緒調節", value: 85 },
];

// Emotion Flow Data
// Value mapping: 1: 抗拒/防衛, 2: 焦慮/退縮, 3: 平靜/中性, 4: 一致/開放
const emotionData = [
  { time: "Start", value: 1, label: "抗拒" },
  { time: "2m", value: 1, label: "抗拒" },
  { time: "4m", value: 2, label: "焦慮" },
  { time: "6m", value: 2, label: "焦慮" },
  { time: "8m", value: 3, label: "平靜" },
  { time: "10m", value: 3, label: "平靜" },
  { time: "12m", value: 4, label: "一致" },
  { time: "End", value: 4, label: "一致" },
];

const defaultChatHistory = [
  { role: "assistant", content: "老師辛苦了！這是一場不容易的對話。關於剛剛的分析報告，或是針對小傑的情況，您有任何想進一步討論的嗎？" },
];

const defaultTranscript = [
  { role: "teacher", content: "小傑，我看你剛才收書包的時候動作有點快，臉色也不太好，還跟小明拌了兩句嘴。現在感覺還好嗎？想聊聊剛才發生了什麼事嗎？" },
  { role: "student", content: "沒什麼啦，就是覺得很煩。小明在那邊一直吵，問一些笨問題，我叫他閉嘴他還不理我。我覺得大家今天都在針對我。" },
  { role: "teacher", content: "聽起來你現在覺得很有壓力，甚至覺得有點委屈，對嗎？當你覺得『大家都在針對你』的時候，心裡面是什麼感覺？是生氣、挫折，還是覺得累了？", highlight: true, note: "很好的情緒指認！幫助學生進行自我覺察。" },
  { role: "student", content: "……都有吧。昨晚沒睡好，今天的數學小考我又沒寫完，然後小明又在那邊鬧，我那時候真的覺得快爆炸了，手心都在冒汗。" },
  { role: "teacher", content: "謝謝你跟我分享這些。你能感覺到『手心冒汗』是很棒的覺察，這通常是身體在提醒你：『我快要超載了』。既然現在我們知道情緒是從壓力累積起來的，你覺得剛才對小明大聲吼叫，有讓你心情變好一點，或是解決數學考試的問題嗎？" },
  { role: "student", content: "其實沒有。吼完他之後我反而覺得更煩，因為現在氣氛變得很尷尬，我也有點後悔，但我那時候就是控制不住自己。" },
  { role: "teacher", content: "這種『控制不住』的感覺每個人都會有。我們來試試看，如果下次你又感覺到手心冒汗、心跳加快時，在說話之前，我們可以先做一個什麼動作來給自己 5 秒鐘的緩衝？比如深呼吸，或是喝口水？" },
  { role: "student", content: "嗯……也許我可以先走去飲水機裝水？離開那個位置一下下可能比較好。但我還是不知道該怎麼跟小明說，我不想讓他覺得我很好欺負。" },
  { role: "teacher", content: "這是一個很好的策略！暫時離開現場能讓大腦冷靜下來。至於小明，你覺得如果用『我訊息』來表達會不會比較好？例如：『我現在心情不太好，需要安靜一下，等下再聊』，這樣既表達了你的邊界，又不會傷害到關係。你覺得他聽完會有什麼反應？", highlight: true, note: "引入了『我訊息』，可以再更深入探討學生的『渴望』(被尊重)。" },
  { role: "student", content: "他應該會喔一聲就走開吧，總比我叫他閉嘴好。那我明天去跟他道個歉好了，畢竟剛才我真的太兇了。" },
  { role: "teacher", content: "小傑，我很欣賞你願意承擔責任並修補關係的勇氣。這不容易，但這會讓你的人際關係變得更穩固。今晚回去先早點休息，把睡眠補回來，好嗎？" },
];

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const teacherTranscript = defaultTranscript.filter((e) => e.role === "teacher");
  const studentTranscript = defaultTranscript.filter((e) => e.role === "student");

  // Custom Y-axis formatter for emotion levels
  const formatYAxis = (value: number) => {
    switch (value) {
      case 1: return "抗拒";
      case 2: return "焦慮";
      case 3: return "平靜";
      case 4: return "一致";
      default: return "";
    }
  };

  const handleRetry = () => {
    const scenarioId = location.state?.currentScenarioId;
    console.log("Retrying scenario ID:", scenarioId);
    navigate("/chatroom", { state: { retryScenarioId: scenarioId } });
  };

  return (
    <AppLayout>
      <div className="p-8 md:p-12 max-w-7xl mx-auto flex flex-col gap-10 min-h-full animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-12 lg:pl-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <Badge className="bg-[#81B29A15] text-[#81B29A] border-[#81B29A30] font-heading font-bold text-[10px] tracking-widest uppercase">Session Completed</Badge>
               <span className="text-[11px] font-bold text-[#A09C94] uppercase tracking-wider">2025/03/01 14:30</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-[#3D3831] tracking-tight mt-2">專家回饋與深度分析</h1>
            <p className="text-[15px] text-[#706C61] font-medium">情境：面對考場失利後的自責與壓力</p>
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
                 <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Grade A+</Badge>
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
                 <Badge className="bg-secondary/10 text-secondary border-none text-[10px]">Positive Trend</Badge>
              </div>
              <div className="h-[240px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={emotionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E07A5F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2D9" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#A09C94', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis 
                      domain={[1, 4]} 
                      ticks={[1, 2, 3, 4]} 
                      tickFormatter={formatYAxis}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#706C61', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatYAxis(value), "情緒狀態"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#E07A5F" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      dot={{ r: 4, fill: '#E07A5F', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[12px] text-[#706C61] font-medium leading-relaxed italic text-center">
                學生的對話姿態從「防衛」成功轉化為「一致開放」
              </p>
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
                <div className="space-y-6">
                  {[
                    { id: 1, title: "建立「情緒預警系統」", text: "老師精準捕捉到了『手心冒汗』。建議進一步引導學生在情緒爆炸前 30 秒就發現生理反應。", quote: "換句話說：「除了手心冒汗，你的肩膀會緊繃嗎？下次如果感覺緊繃，我們能先深呼吸嗎？」" },
                    { id: 2, title: "深化薩提爾的「渴望」層次", text: "學生提到『不想讓他覺得我好欺負』，這反映了對『被尊重』的渴望。", quote: "換句話說：「聽起來你很在意他是否尊重你。我們怎麼表達需求，同時也展現你的力量？」" }
                  ].map(adv => (
                    <div key={adv.id} className="space-y-3 p-5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl group hover:border-primary/30 transition-colors">
                      <h3 className="font-heading text-[15px] font-bold text-[#3D3831] flex items-center gap-2">
                         <span className="text-primary opacity-50">0{adv.id}</span> {adv.title}
                      </h3>
                      <p className="text-sm text-[#706C61] font-medium leading-relaxed">{adv.text}</p>
                      <div className="bg-white border-l-4 border-primary p-3 flex items-start gap-3 rounded-r-lg shadow-sm">
                        <MessageSquare className="w-4 h-4 text-primary shrink-0 opacity-20" />
                        <p className="text-[13px] font-bold text-[#3D3831] leading-relaxed italic">{adv.quote}</p>
                      </div>
                    </div>
                  ))}
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
                  {defaultTranscript.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.role === "teacher" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ animationDelay: `${index * 50}ms` }}>
                      <div
                        className={`max-w-[80%] px-5 py-4 shadow-sm border ${
                          entry.role === "teacher"
                            ? "bg-primary text-white border-primary/10 rounded-[20px] rounded-tr-none"
                            : "bg-white border-[#E5E2D9] text-[#3D3831] rounded-[20px] rounded-tl-none font-medium"
                        } ${entry.highlight ? 'ring-4 ring-accent/20 border-accent/50' : ''}`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-60">
                          {entry.role === "teacher" ? "Teacher Mode" : "Student Input"}
                        </span>
                        <p className="text-[15px] leading-relaxed">{entry.content}</p>
                      </div>
                      {entry.highlight && entry.note && (
                        <div className="mt-3 max-w-[80%] bg-accent/10 text-[#B8A06A] text-[12px] px-4 py-2.5 font-bold rounded-xl border border-accent/20 flex items-start gap-3 shadow-sm">
                          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{entry.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
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
              
              <div className="flex flex-col gap-4 relative z-10">
                {defaultChatHistory.map((msg, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] px-5 py-4 bg-white/10 border border-white/10 text-white/90 text-sm leading-relaxed rounded-[18px] rounded-tl-none font-medium">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex flex-col gap-3">
                <Textarea
                  placeholder="詢問督導建議：例如『如何更好地處理學生的抵觸情緒？』"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[100px] resize-none text-[15px] border-white/10 bg-white/5 text-white placeholder:text-white/30 rounded-xl focus:ring-secondary/50 focus:border-secondary transition-all"
                />
                <button className="h-12 w-full bg-secondary text-white font-heading font-bold text-sm tracking-widest rounded-xl hover:bg-[#6FA088] hover:shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4 fill-current" />
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
