import { describe, it, expect, afterEach, vi } from "vitest";
import { searchRoute } from "./ors.js";

describe("ルート検索APIクライアントのテスト", () => {
  afterEach(() => {
    vi.unstubAllGlobals();//身代わりのリセット
    vi.restoreAllMocks();//Mocksのリセット
  });

  const dummyLocation = { latitude: 35.6812, longitude: 139.7671 };
  const dummyDistance = 5;
  const dummySeed = 1;

  it("サーバーに接続できない場合はSERVER_STOPPEDを返すこと", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      searchRoute(dummyLocation, dummyDistance, dummySeed),
    ).rejects.toMatchObject({
      type: "SERVER_STOPPED",
    });
  });

  it("正常なレスポンスをJSONとして返すこと", async () => {
    const routeData = {
      routes: [
        {
          geometry: "encoded-route",
          summary: { distance: 5000, duration: 300 },
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => routeData,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchRoute(dummyLocation, dummyDistance, dummySeed),
    ).resolves.toEqual(routeData);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/route",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: dummyLocation,
          distance: dummyDistance,
          seed: dummySeed,
        }),
      }),
    );
  });

  it("サーバーから504 TIMEOUTが返された場合はTIMEOUTを返すこと", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => ({
          type: "TIMEOUT",
          message: "ルート検索APIの応答がタイムアウトしました。",
        }),
      }),
    );

    await expect(
      searchRoute(dummyLocation, dummyDistance, dummySeed),
    ).rejects.toMatchObject({
      type: "TIMEOUT",
    });
  });
});
