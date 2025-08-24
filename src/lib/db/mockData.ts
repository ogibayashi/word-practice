// モックデータ - データベースが利用できない場合に使用
import type { QuestionData } from "@/types/database";

export const mockWords: QuestionData[] = [
  {
    id: "1",
    japaneseMeaning: "走る",
    answers: ["run", "jog"],
    synonyms: ["駆ける", "疾走する"]
  },
  {
    id: "2",
    japaneseMeaning: "美しい",
    answers: ["beautiful", "pretty", "gorgeous"],
    synonyms: ["きれい", "素敵", "魅力的"]
  },
  {
    id: "3",
    japaneseMeaning: "大きい",
    answers: ["big", "large", "huge"],
    synonyms: ["巨大", "でかい"]
  },
  {
    id: "4",
    japaneseMeaning: "小さい",
    answers: ["small", "little", "tiny"],
    synonyms: ["ちっちゃい", "細かい"]
  },
  {
    id: "5",
    japaneseMeaning: "食べる",
    answers: ["eat", "consume"],
    synonyms: ["摂取する", "口にする"]
  },
  {
    id: "6",
    japaneseMeaning: "飲む",
    answers: ["drink", "sip"],
    synonyms: ["飲用する", "一口飲む"]
  },
  {
    id: "7",
    japaneseMeaning: "本",
    answers: ["book"],
    synonyms: ["書籍", "図書"]
  },
  {
    id: "8",
    japaneseMeaning: "猫",
    answers: ["cat"],
    synonyms: ["ねこ", "ネコ"]
  },
  {
    id: "9",
    japaneseMeaning: "犬",
    answers: ["dog"],
    synonyms: ["いぬ", "イヌ"]
  },
  {
    id: "10",
    japaneseMeaning: "車",
    answers: ["car", "automobile"],
    synonyms: ["自動車", "クルマ"]
  },
  {
    id: "11",
    japaneseMeaning: "家",
    answers: ["house", "home"],
    synonyms: ["住宅", "我が家"]
  },
  {
    id: "12",
    japaneseMeaning: "学校",
    answers: ["school"],
    synonyms: ["学園", "スクール"]
  },
  {
    id: "13",
    japaneseMeaning: "友達",
    answers: ["friend", "buddy"],
    synonyms: ["仲間", "親友"]
  },
  {
    id: "14",
    japaneseMeaning: "水",
    answers: ["water"],
    synonyms: ["お水", "H2O"]
  },
  {
    id: "15",
    japaneseMeaning: "火",
    answers: ["fire", "flame"],
    synonyms: ["炎", "燃える"]
  },
  {
    id: "16",
    japaneseMeaning: "空",
    answers: ["sky", "heaven"],
    synonyms: ["大空", "青空"]
  },
  {
    id: "17",
    japaneseMeaning: "海",
    answers: ["sea", "ocean"],
    synonyms: ["大海", "海洋"]
  },
  {
    id: "18",
    japaneseMeaning: "山",
    answers: ["mountain", "hill"],
    synonyms: ["やま", "山岳"]
  },
  {
    id: "19",
    japaneseMeaning: "川",
    answers: ["river", "stream"],
    synonyms: ["河川", "小川"]
  },
  {
    id: "20",
    japaneseMeaning: "花",
    answers: ["flower", "blossom"],
    synonyms: ["お花", "華"]
  }
];

// ランダムに指定された数の単語を取得
export function getRandomMockWords(count: number = 10): QuestionData[] {
  const shuffled = [...mockWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// IDで単語を検索
export function getMockWordById(id: string): QuestionData | null {
  return mockWords.find(word => word.id === id) || null;
}

// 回答チェック（モック版）
export function checkMockAnswer(word: QuestionData, userAnswer: string): boolean {
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  return word.answers.some(answer => answer.toLowerCase() === normalizedUserAnswer);
}