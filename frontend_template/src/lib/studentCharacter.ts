// Maps personality IDs to student character names and emotion states to image filenames

const PERSONALITY_TO_CHARACTER: Record<string, string> = {
  hedgehog: "芷婷",
  impulsive: "宇傑",
  anxious: "思妤",
  pressured: "宇翔",
  compliant: "品妍",
  bully: "建宇",
  justice: "柏翰",
  gifted: "睿明",
  creative: "家瑜",
  marginal: "柏宇",
};

const EMOTION_TO_CHINESE: Record<string, string> = {
  neutral: "中性",
  angry: "憤怒",
  sad: "悲傷",
  thinking: "好奇",
  frustrated: "挫折",
  anxious: "焦慮",
  confident: "自信",
  happy: "開心",
  surprised: "驚訝",
};

export type StudentEmotion = keyof typeof EMOTION_TO_CHINESE;

export function getStudentImagePath(personalityId: string, emotion: string): string {
  const character = PERSONALITY_TO_CHARACTER[personalityId] ?? "芷婷";
  const emotionChinese = EMOTION_TO_CHINESE[emotion] ?? "中性";
  return `/img/students/${character}_${emotionChinese}.png`;
}

export function getCharacterName(personalityId: string): string {
  return PERSONALITY_TO_CHARACTER[personalityId] ?? "芷婷";
}

/** Preload all emotion images for a character to prevent flicker */
export function preloadCharacterImages(personalityId: string): void {
  const character = PERSONALITY_TO_CHARACTER[personalityId];
  if (!character) return;
  Object.values(EMOTION_TO_CHINESE).forEach((emotionCn) => {
    const img = new Image();
    img.src = `/img/students/${character}_${emotionCn}.png`;
  });
}
