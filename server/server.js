import express from "express";

const app = express();

function toFiniteNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });//リクエストが受け取れるか確認
});

app.post("/api/route", async (req, res) => {
  const { location, distance, seed } = req.body ?? {};
  const numericDistance = toFiniteNumber(distance);
  const numericSeed = toFiniteNumber(seed);

  const isValidLocation =
    location &&
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180;

  const isValidDistance = [5, 8, 10].includes(numericDistance);
  // isIntegerは整数か確認
  const isValidSeed = Number.isInteger(numericSeed) && numericSeed > 0;

  if (!isValidLocation || !isValidDistance || !isValidSeed) {
    return res.status(400).json({
      type: "INPUT",
      message: "位置情報、距離、またはシード値が正しくありません。",
    });
  }

  const apiKey = process.env.ORS_API_KEY?.trim();
  if (!apiKey) {
    console.error("ORS_API_KEY is not set");
    return res.status(500).json({
      type: "API_KEY_MISSING",
      message:
        "サーバーにORS APIキーが設定されていません。.envファイルを確認してください。",
    });
  }

  try {
    const latitude = location.latitude;
    const longitude = location.longitude;
    const length = numericDistance * 1000;

    const response = await fetch(
      "https://api.heigit.org/openrouteservice/v2/directions/foot-walking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          coordinates: [[longitude, latitude]],
          options: {
            round_trip: {
              length: length,
              seed: numericSeed,
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      throw new Error(`ORS API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.error("ORS request timed out");
      return res.status(504).json({
        type: "TIMEOUT",
        message:
          "ルート検索APIの応答がタイムアウトしました。時間を置いて再試行してください。",
      });
    }

    console.error("ORS request failed:", error);
    return res.status(502).json({
      type: "ORS",
      message: "ルート検索APIとの通信に失敗しました。",
    });
  }
});

// エラーハンドリングミドルウェア
app.use((error, req, res, next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      type: "INPUT",
      message: "リクエストのJSON形式が正しくありません。",
    });
  }

  if (res.headersSent) {
    return next(error);
  }

  const status =
    Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : 500;
  const isClientError = status < 500;

  if (!isClientError) {
    console.error("Unhandled server error:", error);
  }

  return res.status(status).json({
    type: isClientError ? "INPUT" : "SERVER_ERROR",
    message: isClientError
      ? "リクエストを処理できませんでした。入力内容を確認してください。"
      : "サーバー内部でエラーが発生しました。",
  });
});

// NODE_ENVはどの環境で稼働しているかを表す
if (process.env.NODE_ENV !== "test") {
  // マシンが持つすべてのネットワークアドレスで受け付ける
  app.listen(3000, "0.0.0.0", () => {
    console.log("Server started: http://localhost:3000");
  });
}

export default app;
