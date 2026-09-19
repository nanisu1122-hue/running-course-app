export async function searchRoute(location, distance, seed) {
  try {
    const response = await fetch("/api/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location,
        distance,
        seed,
      }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (parseError) {
      if (response.ok) {
        const invalidResponseError = new Error(
          "ルート検索APIから不正なレスポンスが返されました",
          { cause: parseError },
        );
        invalidResponseError.type = "INVALID_RESPONSE";
        throw invalidResponseError;
      }
    }

    if (!response.ok) {
      const error = new Error(
        data?.message ?? "ルート検索APIとの通信に失敗しました",
      );
      error.type = data?.type ?? "ORS";
      throw error;
    }

    return data;
  } catch (error) {
    // あるオブジェクトが、特定のクラスから作られたものかどうか
    if (error instanceof TypeError) {
      const serverError = new Error(
        "APIサーバーに接続できません。サーバーが起動しているか確認してください。",
      );
      serverError.type = "SERVER_STOPPED";
      throw serverError;
    }

    throw error;
  }
}
