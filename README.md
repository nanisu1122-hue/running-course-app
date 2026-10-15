# Run Route

現在地を起点に、指定した距離のランニングコース候補を3件生成し、地図上で確認できるWebアプリケーションです。

## プロジェクトの目的・運用方針

このリポジトリは、Reactによる画面実装、API通信、単体テスト・画面結合テストを学ぶための技術検証（PoC）プロジェクトです。設計・実装の記録をポートフォリオとして公開しています。実サービスとしてデプロイ・運用する予定はありません。

- 動作検証はローカル環境（またはDocker Compose）で行います。
- テストは、主要なユーザー操作と非同期処理の基礎を理解できる構成を目指しています。
- ORS APIキーはバックエンドで扱い、ブラウザへ送信しません。

## 主な機能

- **現在地取得**: ブラウザの Geolocation API を利用した現在地取得
- **コース生成**: OpenRouteService（ORS）の徒歩ルート検索を活用し、選択距離（5km / 8km / 10km）に応じた周回コース候補を3件生成
- **地図描画**: Leaflet / OpenStreetMap によるルート、スタート地点、現在地マーカーの描画
- **現在地追跡**: コース確認中の `watchPosition` による位置情報追跡とマーカー自動更新
- **APIキーの管理**: ORS APIキーをバックエンドに設定し、ブラウザはアプリのAPIサーバーにルート検索を依頼
- **エラーハンドリング**: 位置情報エラー（拒否・タイムアウト等）、APIサーバー停止、外部API障害の検知と画面通知

### 検索からコース確認までの流れ

1. 距離（初期値5km）を選択して「検索」を押すと、検索フォームが「検索中」表示に切り替わります。
2. 現在地を取得し、同じ現在地・選択距離に対して `seed` を1、2、3と変え、`POST /api/route` を順番に3回呼び出します。
3. 全件取得して表示用データへ変換した後、コース候補を3件表示します。一覧では先頭コースを地図に表示します。
4. コースを選ぶと、そのコースの詳細とルートを表示します。別のコースへの選択変更もできます。
5. 「検索画面に戻る」で結果・詳細・現在地・エラーを初期化し、監視を解除します。選択した距離は維持され、再検索できます。

位置情報取得やAPI通信に失敗するとエラー画面へ移り、「検索画面に戻る」で復帰できます。

表示する距離はAPIが返した実際のルート長です。選択した距離は生成の目標値であり、結果と完全に一致するとは限りません。推定時間はルート長に対して **6分/km** で計算し、分単位に丸めています。ORSが返す所要時間は使用していません。

## 技術スタック

- **フロントエンド**: React, Vite, React Leaflet, Leaflet
- **バックエンド**: Express (Node.js)
- **テスト**: Vitest, React Testing Library, Supertest
- **外部サービス / データ**: OpenRouteService API, OpenStreetMap
- **環境構築**: Docker, Docker Compose, Nginx

## システム構成

- **フロントエンド**: ブラウザで位置情報を取得し、相対URL `/api/route` を呼び出して結果を地図に表示します。
- **Express BFF**: `/api/route` の入力検証、ORS APIキーの秘匿、OpenRouteServiceへのリクエスト、エラーのHTTPレスポンス変換を担当します。
- **通信経路**: ローカル開発時はViteのプロキシ、Docker Compose時はNginxのリバースプロキシを経由してExpressへ接続します。

## ディレクトリ構成

主要ファイルのみ記載
```text

├── server/                 # バックエンド（BFF / APIプロキシ）
│   ├── Dockerfile          # Node.js / Express実行用コンテナ設定
│   ├── server.js           # ORS APIへの通信中継・APIキーの秘匿
│   └── server.test.js      # APIのバリデーション・通信・エラーハンドリングのテスト
│
├── src/                    # フロントエンド（React / Vite）
│   ├── api/                # API通信・ブラウザ位置情報API
│   ├── components/         # Map、CourseList、SearchFormなどのUIコンポーネント
│   ├── hooks/              # 位置情報監視などのカスタムフック
│   ├── utils/              # ルート座標の整形・所要時間計算・エラー処理
│   ├── App.jsx             # アプリ全体のレイアウトと状態管理
│   ├── App.test.jsx        # 主要なユーザー操作の画面結合テスト
│   └── main.jsx            # Reactアプリケーションのエントリーポイント
│
├── Dockerfile              # フロントエンドのビルド・Nginx配信用設定
├── docker-compose.yml      # フロントエンド・バックエンドの一括起動設定
├── nginx.conf              # 静的ファイル配信・APIリバースプロキシ設定
└── .env.example            # 環境変数のひな形
```

## 動作要件

- Node.js 22.12以上
- npm
- Geolocation APIに対応したモダンブラウザ
- [OpenRouteService](https://openrouteservice.org/) のAPIキー

APIキーの取得条件、利用制限、料金については、OpenRouteServiceの公式サイトで最新情報を確認してください。

※位置情報を利用するため、ブラウザの許可および `localhost` または `HTTPS` 環境が必要です。

## ローカル起動手順

### 1. 依存関係をインストール

```bash
git clone https://github.com/nanisu1122-hue/running-course-app.git
cd running-course-app
npm ci
cd server
npm ci
cd ..
```

### 2. 環境変数を設定

ルートディレクトリに `.env` を作成し、取得したORS APIキーを設定します。`.env` はGit管理対象外です。

```bash
cp .env.example .env
```

PowerShellの場合は次を使用してください。

```powershell
Copy-Item .env.example .env
```

`.env`:

```dotenv
ORS_API_KEY=あなたのAPIキー
```

### 3. フロントエンドとAPIサーバーを起動

開発時は２つのターミナルを使用します。

ターミナル1（フロントエンド、リポジトリのルートディレクトリで実行）:

```bash
npm run dev
```

ターミナル2（APIサーバー、リポジトリのルートディレクトリで実行）:

```bash
cd server
npm run dev
```

ブラウザでViteが表示したURL（通常は <http://localhost:5173>）を開きます。

- フロントエンド: <http://localhost:5173>
- APIサーバー: <http://localhost:3000>
- ヘルスチェック: <http://localhost:3000/api/health>

開発時のフロントエンドは `/api` へのリクエストを Vite のプロキシ経由で `http://localhost:3000` に転送します。

## Docker Composeで起動（ローカル構成確認用）

ルートディレクトリに `.env` を配置した状態で以下を実行します。

```bash
docker compose up --build
```

- アクセスURL: <http://localhost:8080>
- ヘルスチェック: <http://localhost:8080/api/health>

停止する場合は以下を実行してください。

```bash
docker compose down
```

※フロントエンドはNginx経由で配信され、`/api/` へのリクエストはComposeネットワーク内のExpressサーバーへリバースプロキシされます。

## API仕様

### `GET /api/health`

APIサーバーの稼働確認エンドポイントです。

```json
{ "status": "ok" }
```

### `POST /api/route`

現在地、距離、候補を変えるシード値を受け取り、ORSで算出した周回ルート情報を返します。

リクエスト例:

```json
{
  "location": {
    "latitude": 35.6812,
    "longitude": 139.7671
  },
  "distance": 5,
  "seed": 1
}
```

- `location.latitude`: -90〜90
- `location.longitude`: -180〜180
- `distance`: `5`、`8`、`10` のいずれか（km）
- `seed`: 1以上の整数（フロントエンドから 1, 2, 3 を渡して3件の候補を検索。）

主なエラーレスポンス:

- `400 INPUT`: 位置情報、距離、シード値、またはリクエストのJSONが不正
- `413 INPUT`: リクエストがサイズ制限を超過
- `500 API_KEY_MISSING`: サーバーに `ORS_API_KEY` が設定されていない
- `500 SERVER_ERROR`: サーバー内部で未処理のエラーが発生
- `502 ORS`: OpenRouteServiceとの通信に失敗
- `504 TIMEOUT`: OpenRouteServiceからの応答がタイムアウト

## テスト・検証

Vitest、React Testing Library、Supertestを使用して自動テストを導入しています。

### テスト実行

プロジェクトルートで以下を実行すると、フロントエンド・バックエンドのテストをまとめて実行できます。

```bash
npm test
```

Lint・ビルドの確認は以下で実行できます。

```bash
npm run lint
npm run build
```

### テスト一覧

#### フロントエンド（Vitest + React Testing Library）

- **単体テスト**
  - 現在地取得・監視の成功と失敗、監視解除（`src/api/location.test.js`）
  - `/api/route` のPOST形式、正常応答、通信失敗・タイムアウト・不正JSONの処理（`src/api/ors.test.js`）
  - 位置情報監視の開始、位置の更新・リセット、解除、エラー通知（`src/hooks/useLocationWatcher.test.js`）
  - 座標・距離・推定時間の整形、ルート欠損・距離欠損・距離0の拒否（`src/utils/courseFormatter.test.js`）
  - エラー種別からメッセージへの変換、未知のキーや空のエラーへの対応（`src/utils/errorHandler.test.js`）

- **画面結合テスト：14件**（`src/App.test.jsx`）
  - 自作の初期表示6件：タイトル、距離の説明、選択欄、選択肢、初期値5km、検索ボタン
  - 距離変更と、現在地・距離・`seed` の3回の検索APIへの受け渡し
  - 現在地取得の待機中に「検索中」を表示し、フォームを隠す
  - 検索成功後の3候補・距離・推定時間の表示と、検索中表示の終了
  - 選択コースの詳細表示と、別コースへの選択変更
  - 一覧からの復帰、詳細からの復帰・距離の維持・再検索
  - 位置情報エラーの表示と復帰、APIエラーの表示・復帰・再検索

#### バックエンド（Vitest + Supertest）

`server/server.test.js` で、APIエンドポイント（`/api/route`, `/api/health`）の入力検証、レスポンス形式、APIキー未設定、ORS通信の成功・失敗・タイムアウトを検証しています。

### 自動テストのスコープ・設計方針

単体テストは個々の関数・フック・APIの処理を、画面結合テストはユーザー操作から画面更新までの連携を確認します。学習用PoCとして、App側で細かい異常系を繰り返すことを避け、主要な操作に絞っています。

- **モック化している処理**
  - Appの画面結合テストでは、`getCurrentLocation`・`searchRoute` をモック化し、成功・失敗・取得待機を再現します。位置情報監視は通知しない代替処理にしています。
  - `Map.jsx` 自体をモック化するため、Leafletの描画や地図タイルの取得は行いません。地図以外の画面コンポーネント、formatter、エラーメッセージ変換は実物を使います。
  - 位置情報APIの単体テストでは `navigator.geolocation` を、通信のテストでは `fetch` をモック化します。実際のGPS・外部ネットワーク・API利用枠に依存せず実行できます。

`render`・`screen`・`fireEvent` による描画と操作、`findBy`・`waitFor` による非同期待機を中心にしています。Appテストでは、逐次検索の途中状態、連続submitの厳密な重複防止、監視の内部動作、地図描画は検証対象から外しています。

- **手動・実機検証としている処理**
  - ブラウザ標準の位置情報許可ダイアログの挙動
  - Leaflet（Canvas/DOM）の実ブラウザ描画
  - 地図の表示範囲、ルート・マーカーの切り替え、実端末の現在地更新
  - Vite / Nginxのプロキシを含むフロントエンドからAPIサーバーへの接続
  - 実ORSエンドポイントとの通信疎通

  これらは開発環境での手動統合検証を主としています。

## トラブルシューティング

- 「APIサーバーに接続できません」と表示される:
別ターミナルで `cd server` の上、 `npm run dev` を起動しているか確認してください。

- 「`.env` ファイルを確認してください」と表示される:
ルートの `.env` に有効な `ORS_API_KEY` が設定されているか確認してください。

- 位置情報エラーが表示される:
ブラウザのサイト設定で位置情報のアクセスがブロックされていないか確認し、localhostまたはHTTPS環境でアクセスしてください。

- ORSの応答がタイムアウトする:
外部サービスの負荷やネットワークの状態により失敗する場合があります。少し時間を置いて再検索してください。

## 位置情報と外部サービスの取り扱い

- コース検索時にブラウザから現在地（緯度・経度）の利用許可をリクエストします。
- 取得した緯度・経度は、バックエンドを経由して周回ルート生成のためだけにOpenRouteServiceへ送信されます。
- 位置情報はこのアプリケーションのデータベースやファイルには保存しません。
- コース検索後は `watchPosition` で端末位置を追跡しマーカーを更新しますが、検索画面へ戻る操作により監視・リソースは破棄されます。

## 使用サービス・ライブラリ

- 地図データ: [OpenStreetMap](https://www.openstreetmap.org/copyright)（© OpenStreetMap contributors）
- ルーティング: [openrouteservice.org by HeiGIT](https://openrouteservice.org/)
- ORS API結果の帰属: `© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors`
- 地図描画: [Leaflet](https://leafletjs.com/)、[React Leaflet](https://react-leaflet.js.org/)
- フロントエンド: [React](https://react.dev/)、[Vite](https://vite.dev/)
- APIサーバー: [Express](https://expressjs.com/)

## ライセンス

[MIT License](./LICENSE)
