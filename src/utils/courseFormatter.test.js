import { describe, expect, it } from "vitest";
import { formatRouteToCourse } from "./courseFormatter.js";

describe("formatRouteToCourse", () => {
  const start = { latitude: 35.6812, longitude: 139.7671 };
  const geometry = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

  it("ルート情報を画面表示用のコースへ変換する", () => {
    const course = formatRouteToCourse(
      {
        routes: [{ geometry, summary: { distance: 5000 } }],
      },
      0,
      start,
    );

    expect(course).toMatchObject({
      id: "route-0",
      name: "コース1",
      distance: "距離: 5000m",
      duration: "時間: 30分(6分/㎞)",
      startLocation: start,
    });
    expect(course.routeCoordinates.length).toBeGreaterThan(0);
  });

  it("ルートがない場合はエラーにする", () => {
    expect(() => formatRouteToCourse({}, 1, start)).toThrow(
      "コース2の情報がありません。",
    );
  });

  it("距離がない場合はエラーにする", () => {
    expect(() =>
      formatRouteToCourse(
        { routes: [{ geometry, summary: {} }] },
        0,
        start,
      ),
    ).toThrow("コース1の距離情報がありません。");
  });

  it("距離が0の場合はエラーにする", () => {
    expect(() =>
      formatRouteToCourse(
        { routes: [{ geometry, summary: { distance: 0 } }] },
        0,
        start,
      ),
    ).toThrow("コース1の距離情報がありません。");
  });
});
