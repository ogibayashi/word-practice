import {
  clearUserFromStorage,
  getUserFromStorage,
  isUserLoggedIn,
  saveUserToStorage,
  validateDisplayName,
} from "../localStorage";

describe("localStorage utilities", () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
  });

  describe("saveUserToStorage", () => {
    it("ユーザーデータを正常に保存できる", () => {
      const displayName = "テストユーザー";
      const user = saveUserToStorage(displayName);

      expect(user.displayName).toBe(displayName);
      expect(user.id).toMatch(/^local-\d+-[a-z0-9]+$/);
      expect(user.createdAt).toBeDefined();
      expect(new Date(user.createdAt)).toBeInstanceOf(Date);
    });

    it("前後の空白を取り除いて保存する", () => {
      const displayName = "  テストユーザー  ";
      const user = saveUserToStorage(displayName);

      expect(user.displayName).toBe("テストユーザー");
    });

    it("localStorageに保存される", () => {
      const displayName = "テストユーザー";
      saveUserToStorage(displayName);

      const stored = localStorage.getItem("word-practice-user");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.displayName).toBe(displayName);
    });
  });

  describe("getUserFromStorage", () => {
    it("保存されたユーザーデータを取得できる", () => {
      const displayName = "テストユーザー";
      const savedUser = saveUserToStorage(displayName);

      const retrievedUser = getUserFromStorage();
      expect(retrievedUser).toEqual(savedUser);
    });

    it("データが保存されていない場合はnullを返す", () => {
      const user = getUserFromStorage();
      expect(user).toBeNull();
    });

    it("無効なJSONの場合はnullを返す", () => {
      localStorage.setItem("user", "無効なJSON");

      const user = getUserFromStorage();
      expect(user).toBeNull();
    });

    it("無効な形式のデータの場合はnullを返す", () => {
      const invalidData = { invalid: "data" };
      localStorage.setItem("word-practice-user", JSON.stringify(invalidData));

      const user = getUserFromStorage();
      expect(user).toBeNull();
    });
  });

  describe("clearUserFromStorage", () => {
    it("保存されたユーザーデータを削除できる", () => {
      const displayName = "テストユーザー";
      saveUserToStorage(displayName);

      // データが保存されていることを確認
      expect(getUserFromStorage()).toBeTruthy();

      // データを削除
      clearUserFromStorage();

      // データが削除されていることを確認
      expect(getUserFromStorage()).toBeNull();
    });
  });

  describe("isUserLoggedIn", () => {
    it("ユーザーがログイン済みの場合はtrueを返す", () => {
      const displayName = "テストユーザー";
      saveUserToStorage(displayName);

      expect(isUserLoggedIn()).toBe(true);
    });

    it("ユーザーがログインしていない場合はfalseを返す", () => {
      expect(isUserLoggedIn()).toBe(false);
    });
  });

  describe("validateDisplayName", () => {
    it("有効な名前の場合は{isValid: true}を返す", () => {
      const result = validateDisplayName("テストユーザー");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("空文字の場合はエラーを返す", () => {
      const result = validateDisplayName("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("名前を入力してください");
    });

    it("空白のみの場合はエラーを返す", () => {
      const result = validateDisplayName("   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("名前を入力してください");
    });

    it("50文字を超える場合はエラーを返す", () => {
      const longName = "あ".repeat(51);
      const result = validateDisplayName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("名前は50文字以内で入力してください");
    });

    it("英数字・ひらがな・カタカナ・漢字は有効", () => {
      const validNames = [
        "TestUser123",
        "テストユーザー",
        "テスト ユーザー",
        "田中太郎",
        "test田中123",
      ];

      validNames.forEach((name) => {
        const result = validateDisplayName(name);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
