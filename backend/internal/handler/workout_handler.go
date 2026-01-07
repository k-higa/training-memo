package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/training-memo/backend/internal/middleware"
	"github.com/training-memo/backend/internal/service"
)

type WorkoutHandler struct {
	workoutService *service.WorkoutService
}

func NewWorkoutHandler(workoutService *service.WorkoutService) *WorkoutHandler {
	return &WorkoutHandler{workoutService: workoutService}
}

func (h *WorkoutHandler) CreateWorkout(c echo.Context) error {
	userID := middleware.GetUserID(c)

	var input service.CreateWorkoutInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Date == "" || len(input.Sets) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "date and at least one set are required",
		})
	}

	workout, err := h.workoutService.CreateWorkout(userID, &input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, workout)
}

func (h *WorkoutHandler) GetWorkout(c echo.Context) error {
	userID := middleware.GetUserID(c)

	workoutID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid workout id",
		})
	}

	workout, err := h.workoutService.GetWorkout(userID, workoutID)
	if err != nil {
		if err == service.ErrWorkoutNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "workout not found",
			})
		}
		if err == service.ErrUnauthorized {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "unauthorized",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, workout)
}

func (h *WorkoutHandler) GetWorkoutByDate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	date := c.QueryParam("date")

	if date == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "date query parameter is required",
		})
	}

	workout, err := h.workoutService.GetWorkoutByDate(userID, date)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "workout not found for this date",
		})
	}

	return c.JSON(http.StatusOK, workout)
}

func (h *WorkoutHandler) GetWorkoutList(c echo.Context) error {
	userID := middleware.GetUserID(c)

	page, _ := strconv.Atoi(c.QueryParam("page"))
	perPage, _ := strconv.Atoi(c.QueryParam("per_page"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}

	response, err := h.workoutService.GetWorkoutList(userID, page, perPage)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *WorkoutHandler) UpdateWorkout(c echo.Context) error {
	userID := middleware.GetUserID(c)

	workoutID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid workout id",
		})
	}

	var input service.UpdateWorkoutInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	workout, err := h.workoutService.UpdateWorkout(userID, workoutID, &input)
	if err != nil {
		if err == service.ErrWorkoutNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "workout not found",
			})
		}
		if err == service.ErrUnauthorized {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "unauthorized",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, workout)
}

func (h *WorkoutHandler) DeleteWorkout(c echo.Context) error {
	userID := middleware.GetUserID(c)

	workoutID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid workout id",
		})
	}

	if err := h.workoutService.DeleteWorkout(userID, workoutID); err != nil {
		if err == service.ErrWorkoutNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "workout not found",
			})
		}
		if err == service.ErrUnauthorized {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "unauthorized",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *WorkoutHandler) GetExercises(c echo.Context) error {
	userID := middleware.GetUserID(c)
	muscleGroup := c.QueryParam("muscle_group")

	var exercises interface{}
	var err error

	if muscleGroup != "" {
		exercises, err = h.workoutService.GetExercisesByMuscleGroup(userID, muscleGroup)
	} else {
		exercises, err = h.workoutService.GetExercises(userID)
	}

	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, exercises)
}

// カレンダー用：月別ワークアウト取得
func (h *WorkoutHandler) GetWorkoutsByMonth(c echo.Context) error {
	userID := middleware.GetUserID(c)

	year, err := strconv.Atoi(c.QueryParam("year"))
	if err != nil || year < 2000 || year > 2100 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid year",
		})
	}

	month, err := strconv.Atoi(c.QueryParam("month"))
	if err != nil || month < 1 || month > 12 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid month",
		})
	}

	workouts, err := h.workoutService.GetWorkoutsByMonth(userID, year, month)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, workouts)
}

// 統計：部位別集計
func (h *WorkoutHandler) GetMuscleGroupStats(c echo.Context) error {
	userID := middleware.GetUserID(c)

	stats, err := h.workoutService.GetMuscleGroupStats(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, stats)
}

// 統計：自己ベスト一覧
func (h *WorkoutHandler) GetPersonalBests(c echo.Context) error {
	userID := middleware.GetUserID(c)

	bests, err := h.workoutService.GetPersonalBests(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, bests)
}

// 統計：種目の重量推移
func (h *WorkoutHandler) GetExerciseProgress(c echo.Context) error {
	userID := middleware.GetUserID(c)

	exerciseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid exercise id",
		})
	}

	progress, err := h.workoutService.GetExerciseProgress(userID, exerciseID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, progress)
}

// カスタム種目作成
func (h *WorkoutHandler) CreateCustomExercise(c echo.Context) error {
	userID := middleware.GetUserID(c)

	var input service.CreateExerciseInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Name == "" || input.MuscleGroup == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "name and muscle_group are required",
		})
	}

	exercise, err := h.workoutService.CreateCustomExercise(userID, &input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, exercise)
}

// カスタム種目一覧
func (h *WorkoutHandler) GetCustomExercises(c echo.Context) error {
	userID := middleware.GetUserID(c)

	exercises, err := h.workoutService.GetCustomExercises(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, exercises)
}

// カスタム種目更新
func (h *WorkoutHandler) UpdateCustomExercise(c echo.Context) error {
	userID := middleware.GetUserID(c)

	exerciseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid exercise id",
		})
	}

	var input service.CreateExerciseInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	exercise, err := h.workoutService.UpdateCustomExercise(userID, exerciseID, &input)
	if err != nil {
		if err == service.ErrExerciseNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "exercise not found",
			})
		}
		if err == service.ErrNotCustomExercise {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "cannot modify preset exercise",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, exercise)
}

// カスタム種目削除
func (h *WorkoutHandler) DeleteCustomExercise(c echo.Context) error {
	userID := middleware.GetUserID(c)

	exerciseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid exercise id",
		})
	}

	if err := h.workoutService.DeleteCustomExercise(userID, exerciseID); err != nil {
		if err == service.ErrExerciseNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "exercise not found",
			})
		}
		if err == service.ErrNotCustomExercise {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "cannot delete preset exercise",
			})
		}
		if err == service.ErrExerciseInUse {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "exercise is in use",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.NoContent(http.StatusNoContent)
}
