// Training Memo Backend API Server
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/training-memo/backend/internal/handler"
	"github.com/training-memo/backend/internal/middleware"
	"github.com/training-memo/backend/internal/repository"
	"github.com/training-memo/backend/internal/service"
)

func main() {
	// Echo インスタンスの作成
	e := echo.New()

	// ミドルウェアの設定
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// データベース接続
	db, err := connectDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// リポジトリの初期化
	userRepo := repository.NewUserRepository(db)
	exerciseRepo := repository.NewExerciseRepository(db)
	workoutRepo := repository.NewWorkoutRepository(db)
	menuRepo := repository.NewMenuRepository(db)
	bodyWeightRepo := repository.NewBodyWeightRepository(db)

	// サービスの初期化
	authService := service.NewAuthService(userRepo)
	workoutService := service.NewWorkoutService(workoutRepo, exerciseRepo)
	menuService := service.NewMenuService(menuRepo, exerciseRepo)
	bodyWeightService := service.NewBodyWeightService(bodyWeightRepo)

	// ハンドラーの初期化
	authHandler := handler.NewAuthHandler(authService)
	workoutHandler := handler.NewWorkoutHandler(workoutService)
	menuHandler := handler.NewMenuHandler(menuService)
	bodyWeightHandler := handler.NewBodyWeightHandler(bodyWeightService)

	// ヘルスチェックエンドポイント
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status": "ok",
		})
	})

	// API v1 グループ
	v1 := e.Group("/api/v1")

	// 認証エンドポイント（認証不要）
	v1.POST("/auth/register", authHandler.Register)
	v1.POST("/auth/login", authHandler.Login)

	// 認証が必要なエンドポイント
	authGroup := v1.Group("")
	authGroup.Use(middleware.AuthMiddleware())

	// ユーザー
	authGroup.GET("/auth/me", authHandler.Me)

	// 種目
	authGroup.GET("/exercises", workoutHandler.GetExercises)
	authGroup.GET("/exercises/custom", workoutHandler.GetCustomExercises)
	authGroup.POST("/exercises/custom", workoutHandler.CreateCustomExercise)
	authGroup.PUT("/exercises/custom/:id", workoutHandler.UpdateCustomExercise)
	authGroup.DELETE("/exercises/custom/:id", workoutHandler.DeleteCustomExercise)
	authGroup.GET("/exercises/:id/progress", workoutHandler.GetExerciseProgress)

	// トレーニング記録
	authGroup.POST("/workouts", workoutHandler.CreateWorkout)
	authGroup.GET("/workouts", workoutHandler.GetWorkoutList)
	authGroup.GET("/workouts/date", workoutHandler.GetWorkoutByDate)
	authGroup.GET("/workouts/calendar", workoutHandler.GetWorkoutsByMonth)
	authGroup.GET("/workouts/:id", workoutHandler.GetWorkout)
	authGroup.PUT("/workouts/:id", workoutHandler.UpdateWorkout)
	authGroup.DELETE("/workouts/:id", workoutHandler.DeleteWorkout)

	// 統計
	authGroup.GET("/stats/muscle-groups", workoutHandler.GetMuscleGroupStats)
	authGroup.GET("/stats/personal-bests", workoutHandler.GetPersonalBests)

	// メニュー管理
	authGroup.POST("/menus", menuHandler.CreateMenu)
	authGroup.GET("/menus", menuHandler.GetMenus)
	authGroup.GET("/menus/:id", menuHandler.GetMenu)
	authGroup.PUT("/menus/:id", menuHandler.UpdateMenu)
	authGroup.DELETE("/menus/:id", menuHandler.DeleteMenu)

	// 体重記録
	authGroup.POST("/body-weights", bodyWeightHandler.CreateOrUpdate)
	authGroup.GET("/body-weights", bodyWeightHandler.GetRecords)
	authGroup.GET("/body-weights/range", bodyWeightHandler.GetRecordsByDateRange)
	authGroup.GET("/body-weights/latest", bodyWeightHandler.GetLatest)
	authGroup.DELETE("/body-weights/:id", bodyWeightHandler.Delete)

	// サーバー起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	e.Logger.Fatal(e.Start(":" + port))
}

func connectDB() (*gorm.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "training_user")
	password := getEnv("DB_PASSWORD", "training_password")
	dbname := getEnv("DB_NAME", "training_memo")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port, dbname)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	log.Println("Database connected successfully")
	return db, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
