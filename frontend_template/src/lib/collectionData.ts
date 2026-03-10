// Scenario & history data (shared across Chatroom and History pages)

export interface Scenario {
  id: number;
  title: string;
  tag: string;
  emoji: string;
  description: string;
  guideSentence?: string;
}

export interface CompetencyGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  scenarios: Scenario[];
}

export const COMPETENCY_GROUPS: CompetencyGroup[] = [
  {
    id: "self-awareness",
    label: "自我覺察",
    icon: "🪞",
    color: "hsl(12, 69%, 63%)",
    description: "幫助學生認識自己的情緒、想法與行為模式。",
    scenarios: [
      { id: 1, title: "情緒風暴", tag: "自我覺察", emoji: "😤", description: "學生在課堂上突然情緒爆發，拒絕參與活動。", guideSentence: "試著理解學生情緒背後的原因。" },
      { id: 2, title: "沉默的吶喊", tag: "自我覺察", emoji: "🥺", description: "學生長期沉默，不願意與同學互動或分享想法。", guideSentence: "用溫暖的方式打開學生的心門。" },
    ],
  },
  {
    id: "self-management",
    label: "自我管理",
    icon: "🧘",
    color: "hsl(200, 40%, 65%)",
    description: "學習調節情緒、設定目標與自我激勵的能力。",
    scenarios: [
      { id: 3, title: "考試焦慮", tag: "自我管理", emoji: "😰", description: "學生因為即將到來的考試感到極度焦慮，無法專心上課。", guideSentence: "引導學生學習情緒調節的策略。" },
      { id: 4, title: "拖延迴圈", tag: "自我管理", emoji: "⏰", description: "學生總是拖延作業到最後一刻，陷入焦慮與自責的循環。", guideSentence: "幫助學生建立自我管理的習慣。" },
    ],
  },
  {
    id: "social-awareness",
    label: "社會覺察",
    icon: "🌍",
    color: "hsl(150, 25%, 55%)",
    description: "培養同理心與對他人感受的敏感度。",
    scenarios: [
      { id: 5, title: "被排擠的新生", tag: "社會覺察", emoji: "🧑‍🎓", description: "新轉學生被班上同學排擠，午餐時總是一個人。", guideSentence: "引導學生思考他人的感受。" },
      { id: 6, title: "無聲的霸凌", tag: "社會覺察", emoji: "🤐", description: "學生透過網路對同學進行言語霸凌，受害者不敢求助。", guideSentence: "幫助學生認識霸凌的影響。" },
    ],
  },
  {
    id: "relationship-skills",
    label: "人際技巧",
    icon: "🤝",
    color: "hsl(43, 74%, 70%)",
    description: "學習有效溝通與建立正向關係的方法。",
    scenarios: [
      { id: 7, title: "友誼的裂痕", tag: "人際技巧", emoji: "💔", description: "兩位好友因誤會產生衝突，互不理睬。", guideSentence: "引導學生學習衝突解決的技巧。" },
      { id: 8, title: "團隊風波", tag: "人際技巧", emoji: "🤔", description: "小組報告時，有同學不願意分工合作。", guideSentence: "練習團隊溝通與合作的能力。" },
    ],
  },
  {
    id: "responsible-decision",
    label: "負責決策",
    icon: "⚖️",
    color: "hsl(340, 40%, 65%)",
    description: "培養做出負責任且具建設性決定的能力。",
    scenarios: [
      { id: 9, title: "抄襲的誘惑", tag: "負責決策", emoji: "📝", description: "學生發現好友在考試中作弊，不知道是否該舉報。", guideSentence: "引導學生思考誠實與友誼的平衡。" },
      { id: 10, title: "網路陷阱", tag: "負責決策", emoji: "📱", description: "學生沉迷於網路遊戲，開始影響學業與人際關係。", guideSentence: "幫助學生學習評估行為後果的能力。" },
    ],
  },
];

export const allScenarios: Scenario[] = COMPETENCY_GROUPS.flatMap((g) => g.scenarios);

export interface HistoryItem {
  id: number;
  date: string;
  weekday: string;
  title: string;
  emoji: string;
  duration: string;
  rounds: number;
}

export const historyItems: HistoryItem[] = [
  { id: 1, date: "06/02", weekday: "Mon", title: "情緒風暴", emoji: "😤", duration: "12:34", rounds: 8 },
  { id: 2, date: "05/29", weekday: "Thu", title: "被排擠的新生", emoji: "🧑‍🎓", duration: "09:12", rounds: 6 },
  { id: 3, date: "05/25", weekday: "Sun", title: "沉默的吶喊", emoji: "🥺", duration: "15:45", rounds: 11 },
  { id: 4, date: "05/20", weekday: "Tue", title: "友誼的裂痕", emoji: "💔", duration: "08:22", rounds: 5 },
  { id: 5, date: "05/18", weekday: "Sun", title: "團隊風波", emoji: "🤔", duration: "11:03", rounds: 7 },
];
