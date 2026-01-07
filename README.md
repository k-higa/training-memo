# Training Memo

筋トレ記録・管理Webアプリケーション

## 概要

日々の筋力トレーニングを記録・管理し、進捗を可視化することで、継続的なトレーニングをサポートするWebサービスです。

## 技術スタック

### フロントエンド
| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 状態管理 | TanStack Query (React Query) |
| UIコンポーネント | shadcn/ui |
| グラフ | Recharts |

### バックエンド
| 項目 | 技術 |
|------|------|
| 言語 | Go 1.22+ |
| Webフレームワーク | Echo または Gin |
| ORM | GORM または sqlx |
| 認証 | JWT (golang-jwt/jwt) |
| バリデーション | go-playground/validator |
| マイグレーション | golang-migrate |

### データベース
| 環境 | 技術 |
|------|------|
| 本番環境 | MySQL 8.0 |
| 開発環境 | MySQL 8.0（Docker） |

### インフラ・開発環境
| 項目 | 技術 |
|------|------|
| コンテナ | Docker / Docker Compose |
| 本番ホスティング | AWS ECS / GCP Cloud Run / Kubernetes |
| ストレージ | AWS S3 / GCS |
| 監視 | Prometheus + Grafana |

## ディレクトリ構成

```
traning-memo/
├── docker-compose.yml
├── docs/
│   └── requirements.md      # 要件定義書
├── frontend/                 # Next.js アプリケーション
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── ...
├── backend/                  # Go API サーバー
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── handler/         # HTTPハンドラー
│   │   ├── service/         # ビジネスロジック
│   │   ├── repository/      # データアクセス
│   │   ├── model/           # ドメインモデル
│   │   ├── middleware/      # ミドルウェア
│   │   └── config/          # 設定
│   └── pkg/                  # 共通パッケージ
├── db/
│   ├── migrations/           # マイグレーションファイル
│   └── seeds/                # シードデータ
└── Makefile                  # 開発用コマンド
```

## 開発環境のセットアップ

### 必要なツール
- Docker Desktop
- Make（オプション）

### 起動方法

```bash
# コンテナをビルドして起動
make up-build

# または docker compose を直接使用
docker compose up -d --build
```

### 便利なコマンド（Makefile）

```bash
# コンテナ操作
make up              # コンテナを起動
make up-build        # コンテナをビルドして起動
make down            # コンテナを停止
make logs            # 全コンテナのログを表示
make logs-backend    # バックエンドのログのみ表示
make ps              # コンテナの状態を確認

# シェルアクセス
make frontend-shell  # フロントエンドのシェルに入る
make backend-shell   # バックエンドのシェルに入る
make db-shell        # MySQLシェルに入る

# マイグレーション
make migrate-up      # マイグレーションを実行
make migrate-down    # マイグレーションをロールバック
make migrate-create name=create_xxx_table  # 新規マイグレーションファイル作成

# クリーンアップ
make clean           # 全てをクリーンアップ
```

### ローカル開発環境（Docker Compose）

| サービス | 説明 | ポート |
|----------|------|--------|
| frontend | Next.js（ホットリロード対応） | 3000 |
| backend | Go API（Air によるホットリロード） | 8080 |
| db | MySQL 8.0 | 3306 |
| migrate | golang-migrate（起動時に自動実行） | - |

## ドキュメント

- [要件定義書](./docs/requirements.md)

## ライセンス

MIT License

