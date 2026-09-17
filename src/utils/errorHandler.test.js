import { describe, expect, it } from "vitest";
import { getSearchErrorMessage } from "./errorHandler.js";

describe("getSearchErrorMessage", () => {
  it("既知のエラー種別を画面表示用メッセージへ変換する", () => {
    expect(getSearchErrorMessage({ type: "TIMEOUT" })).toBe(
      "ORSの応答がタイムアウトしました。時間を置いて再検索してください。",
    );
  });

  it("位置情報エラーはエラー自身のメッセージを返す", () => {
    expect(
      getSearchErrorMessage({
        type: "LOCATION_PERMISSION_DENIED",
        message: "位置情報が拒否されました。",
      }),
    ).toBe("位置情報が拒否されました。");
  });

  it("空のエラーや未知のキーでも既定メッセージを返す", () => {
    const fallback = "入力された地点からコースが見つかりませんでした。";

    expect(getSearchErrorMessage()).toBe(fallback);
    expect(getSearchErrorMessage({ type: "toString" })).toBe(fallback);
    expect(getSearchErrorMessage({ type: "UNKNOWN" })).toBe(fallback);
  });
});
