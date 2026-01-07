# 開発用ステージ
FROM golang:1.24-alpine AS development

WORKDIR /app

# Air（ホットリロード）のインストール
RUN go install github.com/air-verse/air@v1.61.7

# 依存関係のキャッシュ
COPY go.mod ./
RUN go mod download

COPY . .

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# ビルド用ステージ
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# 本番用ステージ
FROM alpine:latest AS production

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
