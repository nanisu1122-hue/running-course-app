# Run Route

現在地を起点に、指定した距離のランニングコース候補を3件生成し、地図上で確認できるWebアプリケーションです。

## プロジェクトの目的・運用方針

このリポジトリは、設計・実装の記録およびポートフォリオとしてソースコードを公開している技術検証（PoC）プロジェクトです。常時稼働する公開Webサービスとしての運用は想定していません。

- 動作検証はローカル環境（またはDocker Compose）で行います。
- 認証、レート制限、利用者ごとのAPI利用制限は未実装のため、不特定多数へ向けた公開URLの常設は行わないでください。
- ORS APIキーや位置情報などの機密情報・個人情報保護を考慮し、APIキーはバックエンド経由でのみ扱い、ブラウザ側へは露出させない設計としています。

## 主な機能

- **現在地取得**: ブラウザの Geolocation API を利用した現在地取得
- **コース生成**: OpenRouteService（ORS）の徒歩ルート検索を活用し、選択距離（5km / 8km / 10km）に応じた周回コース候補を3件生成
- **地図描画**: Leaflet / OpenStreetMap によるルート、スタート地点、現在地マーカーの描画
- **現在地追跡**: コース確認中の `watchPosition` による位置情報追跡とマーカー自動更新
- **安全なAPI通信**: ORS APIキーをバックエンドサーバー内に隠蔽し、フロントエンドへの漏洩を防止
- **エラーハンドリング**: 位置情報エラー（拒否・タイムアウト等）、APIサーバー停止、外部API障害の検知と画面通知

## 技術スタック

- **フロントエンド**: React, Vite, React Leaflet, Leaflet
- **バックエンド**: Express (Node.js)
- **テスト**: Vitest, React Testing Library
- **外部サービス / データ**: OpenRouteService API, OpenStreetMap
- **環境構築**: Docker, Docker Compose, Nginx

## システム構成

- **フロントエンド**: ブラウザで位置情報を取得し、相対URL `/api/route` を呼び出して結果を地図に表示します。
- **Express BFF**: `/api/route` の入力検証、ORS APIキーの秘匿、OpenRouteServiceへのリクエスト、エラーのHTTPレスポンス変換を担当します。
- **通信経路**: ローカル開発時はViteのプロキシ、Docker Compose時はNginxのリバースプロキシを経由してExpressへ接続します。

## ディレクトリ構成

主要ファイルのみ記載

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
│   └── main.jsx            # Reactアプリケーションのエントリーポイント
│
├── Dockerfile              # フロントエンドのビルド・Nginx配信用設定
├── docker-compose.yml      # フロントエンド・バックエンドの一括起動設定
├── nginx.conf              # 静的ファイル配信・APIリバースプロキシ設定
└── .env.example            # 環境変数のひな形

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
- `seed`: 1以上の整数（フロントエンドから 1, 2, 3 を渡して異なる3ルートを生成）

主なエラーレスポンス:

- `400 INPUT`: 位置情報、距離、またはシード値が不正
- `500 API_KEY_MISSING`: サーバーに `ORS_API_KEY` が設定されていない
- `502 ORS`: OpenRouteServiceとの通信に失敗
- `504 TIMEOUT`: OpenRouteServiceからの応答がタイムアウト

## テスト・検証

Vitest および React Testing Library を使用して自動テストを導入しています。

### フロントエンド（Vitest + React Testing Library）

```bash
npm test
npm run lint
npm run build
```

### テスト一覧

- **単体テスト**:
  - 位置情報APIの呼び出しと例外ハンドリング (`API/location.test.js`)
  - 位置情報監視フックのライフサイクル・多重解除防止 (`hooks/useLocationWatcher.test.js`)
  - コース座標・所要時間計算の境界値検証 (`utils/courseFormatter.test.js`)
  - エラーメッセージ判定とプロトタイプ汚染対策 (`utils/errorHandler.test.js`)
- **画面統合テスト（予定） (`src/App.test.jsx`)**:
  - 現在地取得からコース生成、地図描画、エラー表示までの一連の画面結合フローを検証予定（現在 `test.todo` としてシナリオ定義済み）

### バックエンド（Vitest）

```bash
cd server
npm test
```

APIエンドポイント（/api/route, /api/health）のバリデーションやレスポンス形式、外部通信ハンドリングを検証します。

## 自動テストのスコープ・設計方針について

テスト実行速度の担保、CIの安定性、および外部APIのレートリミット保護のため、テストピラミッドに基づき以下の切り分けを行っています。

- *モック化している処理*:
  フロントエンドの自動テストでは `navigator.geolocation` および ORS API 通信をモック化しています。外部ネットワーク障害やAPIクォータ消費を気にせず、フロントエンドのテストをローカルで実行できます。バックエンドのテストは `server` ディレクトリで別途実行してください。

- *手動・実機検証としている処理*:
  ブラウザ標準の位置情報許可ダイアログの挙動、Leaflet（Canvas/DOM）の実ブラウザ描画、実ORSエンドポイントとの通信疎通は、開発環境での手動結合検証を主としています。

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
