import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Search, Calendar, ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { historyItems } from "@/lib/collectionData";

export default function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scenarioFilter = searchParams.get("scenario") ?? "";
  const [searchQuery, setSearchQuery] = useState(scenarioFilter);

  const filtered = historyItems.filter(
    (item) => item.title.includes(searchQuery) || item.date.includes(searchQuery)
  );

  const isFiltered = scenarioFilter.length > 0;

  const clearFilter = () => {
    setSearchParams({});
    setSearchQuery("");
  };

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
            {isFiltered && (
              <button onClick={clearFilter} className="p-1 rounded-full hover:bg-[#FAF9F6] transition-colors">
                <X className="w-3.5 h-3.5 text-[#A09C94]" />
              </button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {isFiltered && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-[13px] font-bold text-primary transition-all shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              清除篩選：{scenarioFilter}
            </button>
          )}
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[13px] text-[#706C61] font-medium">
                    練習時長 <span className="text-[#3D3831]">{item.duration}</span> · 回合數 <span className="text-[#3D3831]">{item.rounds}</span>
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/collection`);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    📖 圖鑑
                  </button>
                </div>
              </div>

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
              {isFiltered && (
                <button
                  onClick={clearFilter}
                  className="mt-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all"
                >
                  清除篩選
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
