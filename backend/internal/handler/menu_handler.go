package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/training-memo/backend/internal/service"
)

type MenuHandler struct {
	menuService *service.MenuService
}

func NewMenuHandler(menuService *service.MenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

func (h *MenuHandler) CreateMenu(c echo.Context) error {
	userID := c.Get("user_id").(uint64)

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
	userID := c.Get("user_id").(uint64)

	menus, err := h.menuService.GetMenus(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, menus)
}

func (h *MenuHandler) GetMenu(c echo.Context) error {
	userID := c.Get("user_id").(uint64)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	menu, err := h.menuService.GetMenu(userID, menuID)
	if err != nil {
		if err == service.ErrMenuNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
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

	return c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) UpdateMenu(c echo.Context) error {
	userID := c.Get("user_id").(uint64)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	var input service.CreateMenuInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	menu, err := h.menuService.UpdateMenu(userID, menuID, &input)
	if err != nil {
		if err == service.ErrMenuNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
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

	return c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) DeleteMenu(c echo.Context) error {
	userID := c.Get("user_id").(uint64)

	menuID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid menu id",
		})
	}

	err = h.menuService.DeleteMenu(userID, menuID)
	if err != nil {
		if err == service.ErrMenuNotFound {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "menu not found",
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

