import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// テスト用の単語データ
const testWords = [
  {
    japaneseMeaning: "走る",
    answers: ["run", "jog"],
    isPrimary: [true, false],
    synonyms: ["駆ける", "疾走する"],
  },
  {
    japaneseMeaning: "美しい",
    answers: ["beautiful", "pretty", "gorgeous"],
    isPrimary: [true, false, false],
    synonyms: ["きれい", "素敵", "魅力的"],
  },
  {
    japaneseMeaning: "大きい",
    answers: ["big", "large", "huge"],
    isPrimary: [true, false, false],
    synonyms: ["巨大", "でかい"],
  },
  {
    japaneseMeaning: "小さい",
    answers: ["small", "little", "tiny"],
    isPrimary: [true, false, false],
    synonyms: ["ちっちゃい", "細かい"],
  },
  {
    japaneseMeaning: "食べる",
    answers: ["eat", "consume"],
    isPrimary: [true, false],
    synonyms: ["摂取する", "口にする"],
  },
  {
    japaneseMeaning: "飲む",
    answers: ["drink", "sip"],
    isPrimary: [true, false],
    synonyms: ["飲用する", "一口飲む"],
  },
  {
    japaneseMeaning: "本",
    answers: ["book"],
    isPrimary: [true],
    synonyms: ["書籍", "図書"],
  },
  {
    japaneseMeaning: "猫",
    answers: ["cat"],
    isPrimary: [true],
    synonyms: ["ねこ", "ネコ"],
  },
  {
    japaneseMeaning: "犬",
    answers: ["dog"],
    isPrimary: [true],
    synonyms: ["いぬ", "イヌ"],
  },
  {
    japaneseMeaning: "車",
    answers: ["car", "automobile"],
    isPrimary: [true, false],
    synonyms: ["自動車", "クルマ"],
  },
  {
    japaneseMeaning: "家",
    answers: ["house", "home"],
    isPrimary: [true, false],
    synonyms: ["住宅", "我が家"],
  },
  {
    japaneseMeaning: "学校",
    answers: ["school"],
    isPrimary: [true],
    synonyms: ["学園", "スクール"],
  },
  {
    japaneseMeaning: "友達",
    answers: ["friend", "buddy"],
    isPrimary: [true, false],
    synonyms: ["仲間", "親友"],
  },
  {
    japaneseMeaning: "水",
    answers: ["water"],
    isPrimary: [true],
    synonyms: ["お水", "H2O"],
  },
  {
    japaneseMeaning: "火",
    answers: ["fire", "flame"],
    isPrimary: [true, false],
    synonyms: ["炎", "燃える"],
  },
  {
    japaneseMeaning: "空",
    answers: ["sky", "heaven"],
    isPrimary: [true, false],
    synonyms: ["大空", "青空"],
  },
  {
    japaneseMeaning: "海",
    answers: ["sea", "ocean"],
    isPrimary: [true, false],
    synonyms: ["大海", "海洋"],
  },
  {
    japaneseMeaning: "山",
    answers: ["mountain", "hill"],
    isPrimary: [true, false],
    synonyms: ["やま", "山岳"],
  },
  {
    japaneseMeaning: "川",
    answers: ["river", "stream"],
    isPrimary: [true, false],
    synonyms: ["河川", "小川"],
  },
  {
    japaneseMeaning: "花",
    answers: ["flower", "blossom"],
    isPrimary: [true, false],
    synonyms: ["お花", "華"],
  },
  {
    japaneseMeaning: "木",
    answers: ["tree", "wood"],
    isPrimary: [true, false],
    synonyms: ["樹木", "植物"],
  },
  {
    japaneseMeaning: "鳥",
    answers: ["bird"],
    isPrimary: [true],
    synonyms: ["野鳥", "バード"],
  },
  {
    japaneseMeaning: "魚",
    answers: ["fish"],
    isPrimary: [true],
    synonyms: ["さかな", "フィッシュ"],
  },
  {
    japaneseMeaning: "音楽",
    answers: ["music"],
    isPrimary: [true],
    synonyms: ["ミュージック", "楽曲"],
  },
  {
    japaneseMeaning: "映画",
    answers: ["movie", "film"],
    isPrimary: [true, false],
    synonyms: ["ムービー", "フィルム"],
  },
  {
    japaneseMeaning: "時間",
    answers: ["time"],
    isPrimary: [true],
    synonyms: ["タイム", "時刻"],
  },
  {
    japaneseMeaning: "お金",
    answers: ["money", "cash"],
    isPrimary: [true, false],
    synonyms: ["現金", "貨幣"],
  },
  {
    japaneseMeaning: "仕事",
    answers: ["work", "job"],
    isPrimary: [true, false],
    synonyms: ["労働", "職業"],
  },
  {
    japaneseMeaning: "勉強",
    answers: ["study", "learning"],
    isPrimary: [true, false],
    synonyms: ["学習", "研究"],
  },
  {
    japaneseMeaning: "愛",
    answers: ["love", "affection"],
    isPrimary: [true, false],
    synonyms: ["愛情", "恋"],
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // 既存のデータを削除（テスト用）
  await prisma.learningHistory.deleteMany();
  await prisma.session.deleteMany();
  await prisma.wordAnswer.deleteMany();
  await prisma.word.deleteMany();
  await prisma.user.deleteMany();

  console.log("✨ Cleared existing data");

  // テスト用ユーザーを作成
  const testUser = await prisma.user.create({
    data: {
      displayName: "テストユーザー",
      lineUserId: null,
    },
  });

  console.log(`👤 Created test user: ${testUser.displayName}`);

  // 単語データを投入
  for (const wordData of testWords) {
    const word = await prisma.word.create({
      data: {
        japaneseMeaning: wordData.japaneseMeaning,
        synonyms: wordData.synonyms,
        difficultyLevel: 1,
      },
    });

    // 正解候補を投入
    for (let i = 0; i < wordData.answers.length; i++) {
      await prisma.wordAnswer.create({
        data: {
          wordId: word.id,
          answer: wordData.answers[i]!,
          isPrimary: wordData.isPrimary[i]!,
        },
      });
    }

    console.log(`📝 Created word: ${wordData.japaneseMeaning} (${wordData.answers.join(", ")})`);
  }

  console.log(`✅ Seeded ${testWords.length} words successfully!`);
  console.log("🎉 Seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
