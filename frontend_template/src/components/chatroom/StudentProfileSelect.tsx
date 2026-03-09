import { useState } from "react";
import { ArrowRight, Sparkles, GraduationCap } from "lucide-react";

export const PERSONALITY_TRAITS = [
  { id: "hedgehog", label: "防衛刺蝟型", emoji: "🦔", desc: "容易築起心牆，用攻擊掩飾脆弱" },
  { id: "impulsive", label: "衝動干擾型", emoji: "💥", desc: "行為衝動，常打斷他人或製造混亂" },
  { id: "anxious", label: "焦慮退縮型", emoji: "🐢", desc: "緊張不安，傾向迴避社交與挑戰" },
  { id: "pressured", label: "高壓衝動型", emoji: "🌋", desc: "承受高壓，情緒爆發時難以自控" },
  { id: "compliant", label: "順從壓抑型", emoji: "🎭", desc: "表面乖巧，內心壓抑真實感受" },
  { id: "bully", label: "校園霸王型", emoji: "👊", desc: "以強勢姿態控制同儕關係" },
  { id: "justice", label: "正義風紀型", emoji: "⚖️", desc: "堅持規則正義，對不公極度敏感" },
  { id: "gifted", label: "資優孤傲型", emoji: "🧠", desc: "聰明但難融入，顯得疏離冷漠" },
  { id: "creative", label: "創意散漫型", emoji: "🎨", desc: "富創造力但難以專注常規事務" },
  { id: "marginal", label: "隨和邊緣型", emoji: "🍃", desc: "看似隨和，實則被群體忽略邊緣化" },
];

export const GRADE_LEVELS = [
  { id: "lower-elementary", label: "低年級", desc: "小一～小二", emoji: "🌱" },
  { id: "mid-elementary", label: "中年級", desc: "小三～小四", emoji: "🌿" },
  { id: "upper-elementary", label: "高年級", desc: "小五～小六", emoji: "🌳" },
  { id: "junior-high", label: "國中生", desc: "國一～國三", emoji: "🎓" },
];

export interface StudentProfile {
  personality: string;
  grade: string;
}

interface StudentProfileSelectProps {
  onConfirm: (profile: StudentProfile) => void;
  onBack: () => void;
}

export default function StudentProfileSelect({ onConfirm, onBack }: StudentProfileSelectProps) {
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const canConfirm = selectedPersonality && selectedGrade;

  return (
    <div className="h-full overflow-y-auto px-6 py-8 md:px-12 animate-in fade-in slide-in-from-right-4 duration-400 bg-[#FAF9F6]">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
            Student Profile
          </span>
          <h3 className="font-heading text-2xl font-bold text-[#3D3831]">
            設定虛擬學生角色
          </h3>
          <p className="text-sm text-[#706C61] mt-1">
            選擇學生的個性特質與年級，打造更貼近真實的對話情境
          </p>
        </div>

        {/* Personality Traits */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-heading text-sm font-bold text-[#3D3831] tracking-wide">
              個性特質
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PERSONALITY_TRAITS.map((trait) => (
              <button
                key={trait.id}
                onClick={() => setSelectedPersonality(trait.id)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  selectedPersonality === trait.id
                    ? "border-primary bg-primary/8 shadow-md scale-[1.03]"
                    : "border-[#E5E2D9] bg-white hover:border-[#3D3831]/30 hover:shadow-sm"
                }`}
              >
                <span className="text-2xl">{trait.emoji}</span>
                <span className={`text-xs font-bold leading-tight ${
                  selectedPersonality === trait.id ? "text-primary" : "text-[#3D3831]"
                }`}>
                  {trait.label}
                </span>
                <span className="text-[10px] text-[#A09C94] leading-snug hidden md:block">
                  {trait.desc}
                </span>
                {selectedPersonality === trait.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grade Level */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h4 className="font-heading text-sm font-bold text-[#3D3831] tracking-wide">
              年級
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GRADE_LEVELS.map((grade) => (
              <button
                key={grade.id}
                onClick={() => setSelectedGrade(grade.id)}
                className={`group flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 ${
                  selectedGrade === grade.id
                    ? "border-primary bg-primary/8 shadow-md scale-[1.03]"
                    : "border-[#E5E2D9] bg-white hover:border-[#3D3831]/30 hover:shadow-sm"
                }`}
              >
                <span className="text-3xl">{grade.emoji}</span>
                <span className={`text-sm font-bold ${
                  selectedGrade === grade.id ? "text-primary" : "text-[#3D3831]"
                }`}>
                  {grade.label}
                </span>
                <span className="text-xs text-[#A09C94]">{grade.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-bold text-[#706C61] hover:text-[#3D3831] transition-colors"
          >
            ← 返回情境
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => canConfirm && onConfirm({ personality: selectedPersonality!, grade: selectedGrade! })}
            className={`flex items-center gap-2 px-7 py-3 rounded-xl font-heading text-sm font-bold shadow-lg transition-all duration-200 ${
              canConfirm
                ? "bg-primary text-white hover:bg-[#C8694F] scale-100 hover:scale-[1.02]"
                : "bg-[#E5E2D9] text-[#A09C94] cursor-not-allowed shadow-none"
            }`}
          >
            下一步
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
