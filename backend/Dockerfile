# 開発用ステージ
FROM golang:1.23-alpine AS development

WORKDIR /app

# Air（ホットリロード）のインストール
RUN go install github.com/air-verse/air@v1.61.7

# 依存関係のキャッシュ
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true

COPY . .
RUN go mod tidy

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# ビルド用ステージ
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true

COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# 本番用ステージ
FROM alpine:latest AS production

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
