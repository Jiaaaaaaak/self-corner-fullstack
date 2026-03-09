export interface Scenario {
  id: number;
  title: string;
  tag: string;
  emoji: string;
  description: string;
  guideSentence: string;
}

export interface PracticeRecord {
  id: number;
  date: string;
  weekday: string;
  emoji: string;
  title: string;
  duration: string;
  rounds: number;
  scenarioId: number;
}

export interface CollectionCard extends Scenario {
  unlocked: boolean;
  practiceCount: number;
  totalDuration: string | null;
  records: PracticeRecord[];
}

export const allScenarios: Scenario[] = [
  { id: 1, title: "考場失利後的自責", tag: "自我覺察", emoji: "📝", description: "學生在一次重要考試中表現不佳，感到極度自責和沮喪。他開始質疑自己的能力，甚至不想再上學。", guideSentence: "自責是對自己過高的期待，也是成長的起點。" },
  { id: 2, title: "分組被落單的窘迫", tag: "社會覺察", emoji: "👥", description: "班上分組活動時，有一位學生總是最後一個被選或直接被遺漏。他表面上裝作無所謂，但內心其實很受傷。", guideSentence: "被忽略的感受，值得被看見。" },
  { id: 3, title: "被當眾誤解的憤怒", tag: "自我管理", emoji: "😤", description: "學生在課堂上被同學誤解並當眾指責，他非常憤怒，差點失控動手。你需要幫助他冷靜下來。", guideSentence: "有時候，憤怒只是保護受傷心靈的外殼。" },
  { id: 4, title: "好朋友吵架的糾結", tag: "人際技巧", emoji: "🤝", description: "兩個好朋友因為一件小事吵架了，其中一位來找你傾訴。他既想和好，又覺得委屈。引導他學習溝通技巧。", guideSentence: "珍貴的友誼，值得我們學習如何修復。" },
  { id: 5, title: "面對新環境的焦慮", tag: "自我覺察", emoji: "🌱", description: "學生剛轉學到新班級，對陌生的環境和同學感到極度焦慮。他不敢主動交朋友，午餐時間總是一個人。", guideSentence: "每一次陌生，都是重新認識自己的機會。" },
  { id: 6, title: "承認作弊後的羞愧", tag: "負責決策", emoji: "💭", description: "學生在考試中作弊被發現，他感到非常羞愧，不知道如何面對老師和同學。引導他理解誠實的重要性。", guideSentence: "承認錯誤需要的勇氣，比想像中更大。" },
];

// Mock history data with scenarioId linkage
export const historyItems: PracticeRecord[] = [
  { id: 1, date: "03/01", weekday: "週六", emoji: "😤", title: "被當眾誤解的憤怒", duration: "15:42", rounds: 12, scenarioId: 3 },
  { id: 2, date: "02/27", weekday: "週四", emoji: "📝", title: "考場失利後的自責", duration: "12:08", rounds: 9, scenarioId: 1 },
  { id: 3, date: "02/25", weekday: "週二", emoji: "👥", title: "分組被落單的窘迫", duration: "18:30", rounds: 14, scenarioId: 2 },
  { id: 4, date: "02/20", weekday: "週四", emoji: "🤝", title: "好朋友吵架的糾結", duration: "10:15", rounds: 8, scenarioId: 4 },
  { id: 5, date: "02/15", weekday: "週六", emoji: "🌱", title: "面對新環境的焦慮", duration: "14:22", rounds: 11, scenarioId: 5 },
];

function parseDuration(d: string): number {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + s;
}

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getCollectionCards(): CollectionCard[] {
  return allScenarios.map((scenario) => {
    const records = historyItems.filter((h) => h.scenarioId === scenario.id);
    const unlocked = records.length > 0;
    const totalSec = records.reduce((sum, r) => sum + parseDuration(r.duration), 0);

    return {
      ...scenario,
      unlocked,
      practiceCount: records.length,
      totalDuration: unlocked ? formatDuration(totalSec) : null,
      records,
    };
  });
}

export const COMPETENCY_GROUPS = [
  { id: "self-awareness", label: "自我覺察", icon: "🔍", color: "12 69% 63%", description: "認識自己的情緒、價值觀與能力", scenarios: allScenarios.filter(s => s.tag === "自我覺察") },
  { id: "self-management", label: "自我管理", icon: "🎯", color: "150 25% 55%", description: "調節情緒、設定目標與自律", scenarios: allScenarios.filter(s => s.tag === "自我管理") },
  { id: "social-awareness", label: "社會覺察", icon: "👁️", color: "43 74% 75%", description: "理解他人感受與尊重多元差異", scenarios: allScenarios.filter(s => s.tag === "社會覺察") },
  { id: "relationship-skills", label: "人際技巧", icon: "🤝", color: "200 40% 65%", description: "建立健康關係與有效溝通", scenarios: allScenarios.filter(s => s.tag === "人際技巧") },
  { id: "responsible-decisions", label: "負責決策", icon: "⚖️", color: "340 40% 65%", description: "做出負責任且有建設性的選擇", scenarios: allScenarios.filter(s => s.tag === "負責決策") },
];
