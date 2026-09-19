const ERROR_MESSAGES = {
  LOCATION_TIMEOUT: "位置情報の取得がタイムアウトしました。もう一度お試しください。",
  LOCATION_UNAVAILABLE: "現在地の取得に失敗しました。電波のいい場所でもう一度お試しください。",
  API_KEY_MISSING: ".envファイルを確認してください。",
  SERVER_STOPPED: "APIサーバーに接続できません。サーバーの起動状態を確認してください。",
  TIMEOUT: "ORSの応答がタイムアウトしました。時間を置いて再検索してください。",
  INPUT: "入力された値が正しくありません。",
  INVALID_RESPONSE: "ルート検索APIから正しい応答を受け取れませんでした。もう一度お試しください。",
  SERVER_ERROR: "APIサーバーでエラーが発生しました。時間を置いて再検索してください。",
};

export function getSearchErrorMessage(error) {
  const type = error?.type;

  if (type === "LOCATION_UNSUPPORTED" || type === "LOCATION_PERMISSION_DENIED") {
    return error.message ?? "位置情報の取得に失敗しました。";
  }
  if (Object.hasOwn(ERROR_MESSAGES, type)) {
    return ERROR_MESSAGES[type];
  }
  if (type === "ORS") {
    return "コースの検索に失敗しました。もう一度お試しください。";
  }
  return "入力された地点からコースが見つかりませんでした。";
}
