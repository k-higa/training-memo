package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/training-memo/backend/internal/middleware"
	"github.com/training-memo/backend/internal/service"
)

type BodyWeightHandler struct {
	bodyWeightService *service.BodyWeightService
}

func NewBodyWeightHandler(bodyWeightService *service.BodyWeightService) *BodyWeightHandler {
	return &BodyWeightHandler{bodyWeightService: bodyWeightService}
}

func (h *BodyWeightHandler) CreateOrUpdate(c echo.Context) error {
	userID := middleware.GetUserID(c)

	var input service.CreateBodyWeightInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Date == "" || input.Weight <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "date and weight are required",
		})
	}

	record, err := h.bodyWeightService.CreateOrUpdate(userID, &input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, record)
}

func (h *BodyWeightHandler) GetRecords(c echo.Context) error {
	userID := middleware.GetUserID(c)

	limitStr := c.QueryParam("limit")
	limit := 90 // デフォルト90日分
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	records, err := h.bodyWeightService.GetRecords(userID, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, records)
}

func (h *BodyWeightHandler) GetRecordsByDateRange(c echo.Context) error {
	userID := middleware.GetUserID(c)

	startDate := c.QueryParam("start")
	endDate := c.QueryParam("end")

	if startDate == "" || endDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "start and end date are required",
		})
	}

	records, err := h.bodyWeightService.GetRecordsByDateRange(userID, startDate, endDate)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, records)
}

func (h *BodyWeightHandler) GetLatest(c echo.Context) error {
	userID := middleware.GetUserID(c)

	record, err := h.bodyWeightService.GetLatest(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "no body weight record found",
		})
	}

	return c.JSON(http.StatusOK, record)
}

func (h *BodyWeightHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)

	recordID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid record id",
		})
	}

	err = h.bodyWeightService.Delete(userID, recordID)
	if err != nil {
		if err == service.ErrBodyWeightNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "record not found",
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

