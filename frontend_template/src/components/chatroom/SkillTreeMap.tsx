import { useState, useMemo } from "react";
import { Sparkles, LayoutGrid, List, Search, Clock, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Scenario {
  id: number;
  title: string;
  tag: string;
  emoji: string;
  description: string;
  guideSentence?: string;
}

interface CompetencyGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  scenarios: Scenario[];
}

interface SkillTreeMapProps {
  groups: CompetencyGroup[];
  onSelectScenario: (id: number) => void;
  onOpenSoulCards: () => void;
}

const COMPETENCY_COLORS = [
  "hsl(12, 69%, 63%)",
  "hsl(150, 25%, 55%)",
  "hsl(43, 74%, 70%)",
  "hsl(200, 40%, 65%)",
  "hsl(340, 40%, 65%)",
];

/** Estimated minutes per scenario (mock metadata) */
const SCENARIO_META: Record<number, { estimatedMinutes: number; practiceCount: number }> = {
  1: { estimatedMinutes: 10, practiceCount: 275 },
  2: { estimatedMinutes: 12, practiceCount: 218 },
  3: { estimatedMinutes: 8, practiceCount: 412 },
  4: { estimatedMinutes: 10, practiceCount: 189 },
  5: { estimatedMinutes: 12, practiceCount: 301 },
  6: { estimatedMinutes: 10, practiceCount: 156 },
};

type ViewMode = "grid" | "list";

export default function SkillTreeMap({ groups, onSelectScenario, onOpenSoulCards }: SkillTreeMapProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const allScenarios = useMemo(() => groups.flatMap((g) => g.scenarios), [groups]);

  const filteredScenarios = useMemo(() => {
    let list = activeFilter
      ? groups.find((g) => g.id === activeFilter)?.scenarios ?? []
      : allScenarios;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeFilter, searchQuery, groups, allScenarios]);

  const getGroupColor = (scenario: Scenario) => {
    const idx = groups.findIndex((g) => g.scenarios.some((s) => s.id === scenario.id));
    return COMPETENCY_COLORS[idx % COMPETENCY_COLORS.length];
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-6 pt-5 pb-3 flex flex-col gap-3">
        {/* Row 1: Search + view toggle + soul cards */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋情境名稱、描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm rounded-xl border-border/60"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-muted rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">卡片</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">列表</span>
            </button>
          </div>

          {/* Soul Cards button */}
          <button
            onClick={onOpenSoulCards}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
          >
            <span className="text-lg">🃏</span>
            <span className="text-xs font-bold tracking-wide hidden sm:inline">心靈牌卡</span>
            <Sparkles className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Row 2: Category filters + count */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              !activeFilter
                ? "bg-foreground text-background shadow-md"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            全部
          </button>
          {groups.map((group, idx) => (
            <button
              key={group.id}
              onClick={() => setActiveFilter(activeFilter === group.id ? null : group.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeFilter === group.id
                  ? "text-card shadow-md"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
              style={
                activeFilter === group.id
                  ? { backgroundColor: COMPETENCY_COLORS[idx % COMPETENCY_COLORS.length] }
                  : undefined
              }
            >
              <span className="text-sm">{group.icon}</span>
              {group.label}
            </button>
          ))}
          <span className="text-[11px] text-muted-foreground ml-auto">
            共 {filteredScenarios.length} 個情境
          </span>
        </div>

        {/* Active group description */}
        {activeFilter && (
          <p className="text-xs text-muted-foreground font-medium animate-in fade-in duration-300">
            {groups.find((g) => g.id === activeFilter)?.description}
          </p>
        )}
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1 px-6 pb-6">
        {viewMode === "grid" ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-1">
            {filteredScenarios.map((scenario, idx) => {
              const groupColor = getGroupColor(scenario);
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className="group relative rounded-2xl border-2 border-border/40 bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center p-5 text-center gap-3 cursor-pointer"
                  style={{ animation: `cardFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s both` }}
                >
                  <div
                    className="absolute top-0 left-4 right-4 h-1 rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: groupColor }}
                  />
                  <span className="text-4xl mt-2 group-hover:scale-110 transition-transform duration-300">
                    {scenario.emoji}
                  </span>
                  <h4 className="font-heading text-sm font-bold text-foreground leading-tight line-clamp-2">
                    {scenario.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {scenario.description}
                  </p>
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${groupColor}15`, color: groupColor }}
                  >
                    {scenario.tag}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── List View ── */
          <div className="flex flex-col gap-3 pt-1">
            {filteredScenarios.map((scenario, idx) => {
              const groupColor = getGroupColor(scenario);
              const meta = SCENARIO_META[scenario.id] ?? { estimatedMinutes: 10, practiceCount: 0 };
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className="group w-full text-left rounded-2xl border-2 border-border/40 bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 p-4 flex items-start gap-4 cursor-pointer"
                  style={{ animation: `listFadeIn 0.35s ease-out ${idx * 0.04}s both` }}
                >
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${groupColor}15` }}
                  >
                    {scenario.emoji}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h4 className="font-heading text-sm font-bold text-foreground truncate">
                      {scenario.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {scenario.description}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${groupColor}15`, color: groupColor }}
                      >
                        {scenario.tag}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        約 {meta.estimatedMinutes} 分鐘
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {meta.practiceCount} 人練習
                      </div>
                    </div>
                  </div>

                  <svg className="shrink-0 w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {filteredScenarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Search className="w-8 h-8 opacity-40" />
            <p className="text-sm font-medium">找不到符合條件的情境</p>
            <p className="text-xs">請調整搜尋或篩選條件</p>
          </div>
        )}
      </ScrollArea>

      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes listFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
