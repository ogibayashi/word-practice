import { expect, test } from "@playwright/test";

// prisma/seed.ts の testWords と一致させる（japaneseMeaning -> 正解英単語の一つ）
const JAPANESE_TO_ENGLISH: Record<string, string> = {
  走る: "run",
  美しい: "beautiful",
  大きい: "big",
  小さい: "small",
  食べる: "eat",
  飲む: "drink",
  本: "book",
  猫: "cat",
  犬: "dog",
  車: "car",
  家: "house",
  学校: "school",
  友達: "friend",
  水: "water",
  火: "fire",
  空: "sky",
  海: "sea",
  山: "mountain",
  川: "river",
  花: "flower",
  木: "tree",
  鳥: "bird",
  魚: "fish",
  音楽: "music",
  映画: "movie",
  時間: "time",
  お金: "money",
  仕事: "work",
  勉強: "study",
  愛: "love",
};

function uniqueDisplayName() {
  return `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

async function login(page: import("@playwright/test").Page, displayName: string) {
  await page.goto("/login");
  await page.getByPlaceholder("お名前").fill(displayName);
  await page.getByRole("button", { name: "学習を開始" }).click();
  await page.waitForURL("**/learn");
}

async function readQuestion(page: import("@playwright/test").Page) {
  const answerInput = page.getByPlaceholder("英単語を入力...");
  await expect(answerInput).toBeVisible();
  const meaning = await page.locator("p.text-4xl").first().innerText();
  return meaning.trim();
}

test.describe("学習フロー", () => {
  test("ログインから出題、正解までの一連の流れ", async ({ page }) => {
    await login(page, uniqueDisplayName());

    const meaning = await readQuestion(page);
    const correct = JAPANESE_TO_ENGLISH[meaning];
    expect(correct, `seed に未登録の単語: ${meaning}`).toBeDefined();

    await page.getByPlaceholder("英単語を入力...").fill(correct as string);
    await page.getByRole("button", { name: "回答" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("正解！")).toBeVisible();

    await dialog.getByRole("button", { name: /次の問題|結果を見る/ }).click();
    await expect(dialog).toBeHidden();
  });

  test("不正解時に正解が表示される", async ({ page }) => {
    await login(page, uniqueDisplayName());

    await readQuestion(page);

    await page.getByPlaceholder("英単語を入力...").fill("zzzzz_wrong_zzzzz");
    await page.getByRole("button", { name: "回答" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("不正解")).toBeVisible();
    await expect(dialog.getByText("正解", { exact: true })).toBeVisible();
  });
});
