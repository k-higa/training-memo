package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/training-memo/backend/internal/middleware"
	"github.com/training-memo/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c echo.Context) error {
	var input service.RegisterInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	// バリデーション
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "email, password, and name are required",
		})
	}

	if len(input.Password) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "password must be at least 8 characters",
		})
	}

	response, err := h.authService.Register(&input)
	if err != nil {
		if errors.Is(err, service.ErrEmailAlreadyExists) {
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "email already exists",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to register user",
		})
	}

	return c.JSON(http.StatusCreated, response)
}

func (h *AuthHandler) Login(c echo.Context) error {
	var input service.LoginInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request body",
		})
	}

	if input.Email == "" || input.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "email and password are required",
		})
	}

	response, err := h.authService.Login(&input)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "invalid email or password",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to login",
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) Me(c echo.Context) error {
	userID := middleware.GetUserID(c)

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "user not found",
		})
	}

	return c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) DeleteAccount(c echo.Context) error {
	userID := middleware.GetUserID(c)

	if err := h.authService.DeleteAccount(userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "アカウントの削除に失敗しました",
		})
	}

	return c.NoContent(http.StatusNoContent)
}

