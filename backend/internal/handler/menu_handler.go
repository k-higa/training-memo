package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/training-memo/backend/internal/middleware"
	"github.com/training-memo/backend/internal/service"
)

type MenuHandler struct {
	menuService   *service.MenuService
	aiMenuService *service.AIMenuService
}

func NewMenuHandler(menuService *service.MenuService, aiMenuService *service.AIMenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService, aiMenuService: aiMenuService}
}

func (h *MenuHandler) CreateMenu(c echo.Context) error {
	userID := middleware.GetUserID(c)

	var input service.CreateMenuInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Name == "" || len(input.Items) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "name and at least one item are required",
		})
	}

	menu, err := h.menuService.CreateMenu(userID, &input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, menu)
}

func (h *MenuHandler) GetMenus(c echo.Context) error {
	userID := middleware.GetUserID(c)

	menus, err := h.menuService.GetMenus(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, menus)
}

func (h *MenuHandler) GetMenu(c echo.Context) error {
	userID := middleware.GetUserID(c)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	menu, err := h.menuService.GetMenu(userID, menuID)
	if err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
			})
		}
		if errors.Is(err, service.ErrUnauthorized) {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "unauthorized",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) UpdateMenu(c echo.Context) error {
	userID := middleware.GetUserID(c)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	var input service.UpdateMenuInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	menu, err := h.menuService.UpdateMenu(userID, menuID, &input)
	if err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
			})
		}
		if errors.Is(err, service.ErrUnauthorized) {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "unauthorized",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) GenerateMenuWithAI(c echo.Context) error {
	userID := middleware.GetUserID(c)

	var input service.GenerateMenuInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Goal == "" || input.FitnessLevel == "" || input.DaysPerWeek == 0 || input.DurationMinutes == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "goal, fitness_level, days_per_week, duration_minutes are required",
		})
	}

	output, err := h.aiMenuService.GenerateMenu(c.Request().Context(), userID, &input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, output)
}

func (h *MenuHandler) DeleteMenu(c echo.Context) error {
	userID := middleware.GetUserID(c)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	err = h.menuService.DeleteMenu(userID, menuID)
	if err != nil {
		if errors.Is(err, service.ErrMenuNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
			})
		}
		if errors.Is(err, service.ErrUnauthorized) {
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

