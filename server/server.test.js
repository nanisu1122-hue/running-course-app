import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "./server.js";

describe("サーバーの自動テスト", () => {
  // バックアップ
  const originalEnv = process.env;

  beforeEach(() => {
    // テスト間の汚染を防ぐ
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("GET /api/health で 200 と { status: 'ok' } を返すこと", async () => {
    const res = await request(app).get("/api/health");//request(app)で疑似リクエストを送る

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("距離や位置情報が不正な場合は 400 を返すこと", async () => {
    const res = await request(app).post("/api/route").send({
      location: null,
      distance: 999, // 許可されていない距離
    });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("INPUT");
  });

  it("配列やオブジェクトを距離・シード値として受け付けないこと", async () => {
    const res = await request(app).post("/api/route").send({
      location: { latitude: 35.6812, longitude: 139.7671 },
      distance: [5],
      seed: { value: 1 },
    });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("INPUT");
  });

  it("不正なJSONの場合はJSON形式の400エラーを返すこと", async () => {
    const res = await request(app)
      .post("/api/route")
      .set("Content-Type", "application/json")
      .send("{");

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.type).toBe("INPUT");
  });

  it("JSONのサイズ制限を超えた場合もJSON形式のエラーを返すこと", async () => {
    const res = await request(app)
      .post("/api/route")
      .send({ payload: "a".repeat(110 * 1024) });

    expect(res.status).toBe(413);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.type).toBe("INPUT");
  });

  it("ORS_API_KEY が未設定の場合は 500 と API_KEY_MISSING を返すこと", async () => {
    delete process.env.ORS_API_KEY;

    const res = await request(app)
      .post("/api/route")
      .send({
        location: { latitude: 35.6812, longitude: 139.7671 },
        distance: 5,
        seed: 1,
      });

    expect(res.status).toBe(500);
    expect(res.body.type).toBe("API_KEY_MISSING");
  });

  it("ORSが正常なルートを返した場合は200とレスポンスを返すこと", async () => {
    process.env.ORS_API_KEY = "  test-api-key  ";
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

    const res = await request(app)
      .post("/api/route")
      .send({
        location: { latitude: 35.6812, longitude: 139.7671 },
        distance: 5,
        seed: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(routeData);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.heigit.org/openrouteservice/v2/directions/foot-walking",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "test-api-key" }),
        body: JSON.stringify({
          coordinates: [[139.7671, 35.6812]],
          options: {
            round_trip: {
              length: 5000,
              seed: 1,
            },
          },
        }),
      }),
    );
  });

  it("ORSがタイムアウトした場合は504とTIMEOUTを返すこと", async () => {
    process.env.ORS_API_KEY = "test-api-key";
    const timeoutError = new Error("request timed out");
    timeoutError.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const res = await request(app)
      .post("/api/route")
      .send({
        location: { latitude: 35.6812, longitude: 139.7671 },
        distance: 5,
        seed: 1,
      });

    expect(res.status).toBe(504);
    expect(res.body.type).toBe("TIMEOUT");
  });

  it("ORSがエラー応答を返した場合は502とORSを返すこと", async () => {
    process.env.ORS_API_KEY = "test-api-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );

    const res = await request(app)
      .post("/api/route")
      .send({
        location: { latitude: 35.6812, longitude: 139.7671 },
        distance: 5,
        seed: 1,
      });

    expect(res.status).toBe(502);
    expect(res.body.type).toBe("ORS");
  });
});
