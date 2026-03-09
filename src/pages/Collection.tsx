import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getCollectionCards, type CollectionCard } from "@/lib/collectionData";
import {
  X,
  Clock3,
  RotateCcw,
  ArrowRight,
  Lock,
  MessageCircle,
} from "lucide-react";

export default function Collection() {
  const navigate = useNavigate();
  const cards = getCollectionCards();
  const [selected, setSelected] = useState<CollectionCard | null>(null);

  const unlockedCount = cards.filter((c) => c.unlocked).length;
  const progressPct = Math.round((unlockedCount / cards.length) * 100);

  return (
    <AppLayout>
      <div className="p-8 md:p-12 max-w-6xl mx-auto flex flex-col gap-10 min-h-full animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pl-12 lg:pl-0">
          <div className="flex flex-col gap-1">
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Soul Album
            </span>
            <h1 className="font-heading text-3xl font-bold text-[#3D3831] tracking-tight">
              心靈圖鑑
            </h1>
            <p className="text-sm text-[#706C61] font-medium mt-1">
              收集你探索過的情緒牌卡，見證每一步成長
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-[280px]">
            <div className="flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#706C61]">
                已收集 <span className="text-primary">{unlockedCount}</span> / {cards.length} 張
              </span>
              <span className="text-[#A09C94]">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => (card.unlocked ? setSelected(card) : undefined)}
              className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all text-center group ${
                card.unlocked
                  ? "bg-white border-[#E5E2D9] shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
                  : "bg-[#FAF9F6] border-dashed border-[#E5E2D9] opacity-60 grayscale cursor-default"
              }`}
            >
              {card.unlocked && (
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <div
                className={`relative w-16 h-16 rounded-xl flex items-center justify-center text-4xl transition-transform ${
                  card.unlocked
                    ? "bg-[#FAF9F6] shadow-inner group-hover:scale-110"
                    : "bg-[#E5E2D9]/50"
                }`}
              >
                {card.unlocked ? card.emoji : <Lock className="w-6 h-6 text-[#A09C94]" />}
              </div>

              <h3
                className={`font-heading text-[15px] font-bold leading-snug ${
                  card.unlocked ? "text-[#3D3831] group-hover:text-primary" : "text-[#A09C94]"
                } transition-colors`}
              >
                {card.unlocked ? card.title : "尚未探索"}
              </h3>

              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  card.unlocked
                    ? "border-primary/20 text-primary"
                    : "border-[#E5E2D9] text-[#A09C94]"
                }`}
              >
                {card.tag}
              </Badge>

              {card.unlocked && (
                <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-[#706C61]">
                  <span>×{card.practiceCount}</span>
                </div>
              )}

              {!card.unlocked && (
                <span className="text-[11px] text-[#A09C94] font-medium mt-1">
                  前往對話空間解鎖
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail Overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[#E5E2D9] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-8 pb-6 flex flex-col items-center gap-4 border-b border-[#E5E2D9]">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF9F6] flex items-center justify-center hover:bg-[#E5E2D9] transition-colors"
              >
                <X className="w-4 h-4 text-[#706C61]" />
              </button>

              <div className="w-20 h-20 rounded-2xl bg-[#FAF9F6] shadow-inner flex items-center justify-center text-5xl">
                {selected.emoji}
              </div>
              <h2 className="font-heading text-xl font-bold text-[#3D3831]">{selected.title}</h2>
              <Badge variant="outline" className="border-primary/20 text-primary text-[11px] font-bold">
                {selected.tag}
              </Badge>

              <p className="text-sm text-[#706C61] italic text-center leading-relaxed mt-1">
                「{selected.guideSentence}」
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-[#E5E2D9] border-b border-[#E5E2D9]">
              {[
                { icon: RotateCcw, label: "練習次數", value: `${selected.practiceCount} 次` },
                { icon: Clock3, label: "總時長", value: selected.totalDuration ?? "-" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1.5 py-5">
                  <s.icon className="w-4 h-4 text-[#A09C94]" />
                  <span className="font-heading text-lg font-bold text-[#3D3831]">{s.value}</span>
                  <span className="text-[10px] font-bold text-[#A09C94] uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Personal note */}
            <div className="p-6 border-b border-[#E5E2D9]">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-[#A09C94]" />
                <span className="font-heading text-xs font-bold text-[#3D3831] uppercase tracking-wider">
                  心得筆記
                </span>
              </div>
              <div className="bg-[#FAF9F6] rounded-xl p-4 text-sm text-[#A09C94] italic border border-dashed border-[#E5E2D9]">
                尚未撰寫心得…完成練習後可在此記錄你的感悟。
              </div>
            </div>

            <div className="p-6">
              <button
                onClick={() => {
                  setSelected(null);
                  navigate(`/history?scenario=${encodeURIComponent(selected.title)}`);
                }}
                className="w-full h-12 bg-[#3D3831] text-white font-heading font-bold rounded-xl shadow-lg hover:bg-[#2A2520] transition-all flex items-center justify-center gap-2 text-sm"
              >
                查看相關練習歷史
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
