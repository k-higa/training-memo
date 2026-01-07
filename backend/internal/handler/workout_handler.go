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

