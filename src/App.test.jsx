import { describe, test } from 'vitest';

describe('App', () => {
  describe('初期画面の表示', () => {
    test.todo('タイトルが表示される');
    test.todo('距離選択が表示される');
    test.todo('「検索」ボタンが表示される');
  });

  describe('フォーム操作と検索パラメータの連動', () => {
    test.todo('距離変更が検索処理に反映される（例: 8km選択時、3回のAPI呼び出しすべてに distance: 8 が渡される）');
  });

  describe('検索中のローディングと重複防止', () => {
    test.todo('検索中のローディング状態が表示される');
    test.todo('検索ボタンの連打時に重複してAPIリクエストが飛ばない');
  });

  describe('位置情報のエラー処理', () => {
    test.todo('位置情報拒否時にエラーメッセージが表示される (getCurrentLocation をモック)');
  });

  describe('API通信エラー時の処理', () => {
    test.todo('APIサーバー停止時 (SERVER_STOPPED) に適切なエラーメッセージが表示される');
    test.todo('APIキー未設定時 (API_KEY_MISSING) に適切なエラーメッセージが表示される');
    test.todo('タイムアウト時 (TIMEOUT) に適切なエラーメッセージが表示される');
    test.todo('ORS側のエラー発生時に適切なエラーメッセージが表示される');
  });

  describe('検索成功時の画面遷移と現在地監視', () => {
    test.todo('現在地と searchRoute (3回分) をモックしてコース1〜3が表示される');
    test.todo('コース検索後に現在地監視 (watchPosition) が開始される');
  });

  describe('詳細画面と戻る操作', () => {
    test.todo('「地図を表示」を押すとコース詳細が表示される');
    test.todo('「検索画面に戻る」を押すと元の画面に戻り、現在地監視が停止する');
  });
});