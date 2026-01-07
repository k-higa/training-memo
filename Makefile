.PHONY: up down build logs ps db-shell migrate-up migrate-down migrate-create frontend-shell backend-shell clean

# Docker Compose コマンド
up:
	docker compose up -d

up-build:
	docker compose up -d --build

down:
	docker compose down

down-volumes:
	docker compose down -v

build:
	docker compose build

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

ps:
	docker compose ps

# シェルアクセス
frontend-shell:
	docker compose exec frontend sh

backend-shell:
	docker compose exec backend sh

db-shell:
	docker compose exec db mysql -u training_user -ptraining_password training_memo

# マイグレーション
migrate-up:
	docker compose run --rm migrate -path /migrations -database "mysql://training_user:training_password@tcp(db:3306)/training_memo" up

migrate-down:
	docker compose run --rm migrate -path /migrations -database "mysql://training_user:training_password@tcp(db:3306)/training_memo" down 1

migrate-drop:
	docker compose run --rm migrate -path /migrations -database "mysql://training_user:training_password@tcp(db:3306)/training_memo" drop -f

migrate-version:
	docker compose run --rm migrate -path /migrations -database "mysql://training_user:training_password@tcp(db:3306)/training_memo" version

# マイグレーションファイル作成（例: make migrate-create name=create_xxx_table）
migrate-create:
	@if [ -z "$(name)" ]; then echo "Usage: make migrate-create name=<migration_name>"; exit 1; fi
	docker run --rm -v $(PWD)/db/migrations:/migrations migrate/migrate create -ext sql -dir /migrations -seq $(name)

# クリーンアップ
clean:
	docker compose down -v --rmi local
	rm -rf frontend/node_modules frontend/.next
	rm -rf backend/tmp

# ヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo "  make up             - コンテナを起動"
	@echo "  make up-build       - コンテナをビルドして起動"
	@echo "  make down           - コンテナを停止"
	@echo "  make down-volumes   - コンテナとボリュームを削除"
	@echo "  make build          - コンテナをビルド"
	@echo "  make logs           - 全コンテナのログを表示"
	@echo "  make logs-backend   - バックエンドのログを表示"
	@echo "  make logs-frontend  - フロントエンドのログを表示"
	@echo "  make logs-db        - データベースのログを表示"
	@echo "  make ps             - コンテナの状態を表示"
	@echo "  make frontend-shell - フロントエンドのシェルに入る"
	@echo "  make backend-shell  - バックエンドのシェルに入る"
	@echo "  make db-shell       - MySQLシェルに入る"
	@echo "  make migrate-up     - マイグレーションを実行"
	@echo "  make migrate-down   - マイグレーションをロールバック"
	@echo "  make migrate-create - マイグレーションファイルを作成"
	@echo "  make clean          - 全てをクリーンアップ"

