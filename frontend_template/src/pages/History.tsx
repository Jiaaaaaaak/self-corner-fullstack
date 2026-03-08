import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Search, Calendar, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const historyItems = [
  { id: 1, date: "03/01", weekday: "週六", emoji: "😤", title: "國中生拒絕交作業", duration: "15:42", rounds: 12, grade: "A+" },
  { id: 2, date: "02/27", weekday: "週四", emoji: "🥺", title: "考場失利後的自責", duration: "12:08", rounds: 9, grade: "A" },
  { id: 3, date: "02/25", weekday: "週二", emoji: "👥", title: "分組被落單的窘迫", duration: "18:30", rounds: 14, grade: "B+" },
  { id: 4, date: "02/20", weekday: "週四", emoji: "🤝", title: "好朋友吵架的糾結", duration: "10:15", rounds: 8, grade: "A+" },
  { id: 5, date: "02/15", weekday: "週六", emoji: "🌱", title: "面對新環境的焦慮", duration: "14:22", rounds: 11, grade: "B" },
];

const gradeStyles = (grade: string) => {
  if (grade.startsWith("A")) return "bg-[#81B29A15] text-[#81B29A] border-[#81B29A30]";
  return "bg-[#F2CC8F20] text-[#D4A853] border-[#F2CC8F40]";
};

export default function History() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = historyItems.filter(
    (item) => item.title.includes(searchQuery) || item.date.includes(searchQuery)
  );

  return (
    <AppLayout>
      <div className="p-8 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 min-h-full animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pl-12 lg:pl-0">
          <div className="flex flex-col gap-1">
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Activity Tracker</span>
            <h1 className="font-heading text-3xl font-bold text-[#3D3831] tracking-tight">練習歷史紀錄</h1>
          </div>
          <div className="flex items-center gap-3 h-12 px-4 border border-[#E5E2D9] bg-white rounded-xl shadow-sm w-full md:w-[320px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all group">
            <Search className="w-4 h-4 text-[#A09C94] group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="搜尋情境、日期或關鍵字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#A09C94] text-[#3D3831] font-medium"
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-lg text-[13px] font-bold text-[#706C61] hover:border-primary hover:text-primary transition-all shadow-sm group">
            <Calendar className="w-4 h-4 text-[#A09C94] group-hover:text-primary" />
            最近 30 天
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-lg text-[13px] font-bold text-[#706C61] hover:border-primary hover:text-primary transition-all shadow-sm group">
            <Filter className="w-4 h-4 text-[#A09C94] group-hover:text-primary" />
            所有情緒類型
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-[20px]" />
          <span className="text-[12px] font-bold text-[#A09C94] uppercase tracking-wider">
            Found {filtered.length} Sessions
          </span>
        </div>

        {/* History list */}
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate("/feedback")}
              className="flex items-center gap-6 px-8 py-5 bg-white border border-[#E5E2D9] rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 transition-all text-left w-full group"
            >
              {/* Date */}
              <div className="w-16 shrink-0 flex flex-col items-center py-1 border-r border-[#E5E2D9] pr-6">
                <span className="font-heading text-base font-bold text-[#3D3831]">{item.date}</span>
                <span className="text-[11px] font-bold text-[#A09C94] uppercase">{item.weekday}</span>
              </div>

              {/* Emoji */}
              <div className="w-14 h-14 bg-[#FAF9F6] rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                {item.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-bold text-[#3D3831] truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[#706C61] font-medium mt-1">
                  練習時長 <span className="text-[#3D3831]">{item.duration}</span> · 回合數 <span className="text-[#3D3831]">{item.rounds}</span>
                </p>
              </div>

              {/* Score badge */}
              <Badge className={`px-3 py-1 font-heading text-xs font-bold rounded-lg border shadow-sm ${gradeStyles(item.grade)}`}>
                {item.grade}
              </Badge>

              {/* Arrow */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-[#A09C94] group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-[#E5E2D9] flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#FAF9F6] rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-[#A09C94] opacity-40" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-lg font-bold text-[#3D3831]">找不到相關紀錄</p>
                <p className="text-sm text-[#706C61] font-medium">換個關鍵字搜尋看看吧！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
