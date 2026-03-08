import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, MessageSquare, MessageCircle, CheckSquare, Search, Target, Quote } from "lucide-react";

interface TranscriptEntry {
  role: string;
  content: string;
  highlight?: boolean;
  note?: string;
}

interface FeedbackTabsProps {
  transcript: TranscriptEntry[];
  userInput: string;
  onUserInputChange: (value: string) => void;
  chatHistory: { role: string; content: string }[];
}

export default function FeedbackTabs({ transcript, userInput, onUserInputChange, chatHistory }: FeedbackTabsProps) {
  return (
    <div className="flex-1 flex flex-col gap-8 min-w-0">
      <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col flex-1 min-h-[500px] overflow-hidden">
        <Tabs defaultValue="expert" className="flex flex-col flex-1">
          <div className="px-8 pt-5 border-b border-border bg-muted/30">
            <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none">
              <TabsTrigger
                value="expert"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 pb-3 pt-1 font-heading font-bold text-sm text-muted-foreground data-[state=active]:text-foreground"
              >
                專家建議
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 pb-3 pt-1 font-heading font-bold text-sm text-muted-foreground data-[state=active]:text-foreground"
              >
                對話逐字稿
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Expert Suggestions Tab */}
          <TabsContent value="expert" className="flex-1 m-0 flex flex-col">
            <ScrollArea className="flex-1 px-8 py-8">
              <div className="space-y-8">
                {/* 亮點肯定 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-secondary">
                    <CheckSquare className="w-4 h-4" />
                    亮點肯定
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    你在對話中展現了良好的傾聽姿態，特別是在學生表達抗拒時，沒有急於說教，而是嘗試理解背後的感受。這是薩提爾模式中「一致性溝通」的重要基礎。
                  </p>
                </div>

                {/* 盲點發現 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-primary">
                    <Search className="w-4 h-4" />
                    盲點發現
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    在第三輪對話中，當學生說「為什麼大人都只會叫我寫作業」時，你的回應偏向理性解釋。建議嘗試先回應情緒層面。
                  </p>
                  {/* Quote Block */}
                  <div className="bg-muted/50 border-l-[3px] border-primary rounded-r-lg p-4 flex items-start gap-3">
                    <Quote className="w-5 h-5 text-primary/40 shrink-0 mt-0.5 rotate-180" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">原本可以這樣說：</p>
                      <p className="text-sm text-foreground font-bold italic leading-relaxed">
                        「聽起來你覺得作業對你來說沒有意義，這讓你很挫折對嗎？」
                      </p>
                    </div>
                  </div>
                </div>

                {/* 行動建議 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-accent-foreground">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-accent">行動建議</span>
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    下次遇到類似情境，試著先命名學生的情緒，再引導探索冰山下的深層需求。
                  </p>
                </div>
              </div>
            </ScrollArea>

            {/* AI Coach inline */}
            <div className="border-t border-border bg-foreground/[0.03] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-secondary-foreground" />
                </div>
                <h3 className="font-heading text-sm font-bold text-foreground">與 AI 專業督導對話</h3>
              </div>
              {chatHistory.map((msg, i) => (
                <div key={i} className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-xl px-4 py-3">
                  {msg.content}
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="詢問督導建議：例如『如何更好地處理學生的抵觸情緒？』"
                  value={userInput}
                  onChange={(e) => onUserInputChange(e.target.value)}
                  className="min-h-[60px] resize-none text-sm rounded-xl"
                  rows={2}
                />
                <button className="h-auto px-4 bg-primary text-primary-foreground font-heading font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                  發送
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="flex-1 m-0">
            <ScrollArea className="h-[300px] px-8 py-8">
              <div className="space-y-6">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${entry.role === "teacher" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-4 shadow-sm border ${
                        entry.role === "teacher"
                          ? "bg-primary text-primary-foreground border-primary/10 rounded-[20px] rounded-tr-none"
                          : "bg-card border-border text-foreground rounded-[20px] rounded-tl-none font-medium"
                      } ${entry.highlight ? "ring-4 ring-accent/20 border-accent/50" : ""}`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-60">
                        {entry.role === "teacher" ? "Teacher Mode" : "Student Input"}
                      </span>
                      <p className="text-[15px] leading-relaxed">{entry.content}</p>
                    </div>
                    {entry.highlight && entry.note && (
                      <div className="mt-3 max-w-[80%] bg-accent/10 text-accent-foreground text-[12px] px-4 py-2.5 font-bold rounded-xl border border-accent/20 flex items-start gap-3 shadow-sm">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                        <p className="leading-relaxed">{entry.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
