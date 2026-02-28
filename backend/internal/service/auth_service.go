package service

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/training-memo/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo UserRepository
}

func NewAuthService(userRepo UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type RegisterInput struct {
	Email    string   `json:"email" validate:"required,email"`
	Password string   `json:"password" validate:"required,min=8"`
	Name     string   `json:"name" validate:"required,min=1,max=100"`
	Height   *float64 `json:"height"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

func (s *AuthService) Register(input *RegisterInput) (*AuthResponse, error) {
	exists, err := s.userRepo.ExistsByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Name:         input.Name,
		Height:       input.Height,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) Login(input *LoginInput) (*AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("finding user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) GetUserByID(userID uint64) (*model.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *AuthService) DeleteAccount(userID uint64) error {
	return s.userRepo.DeleteWithAllData(userID)
}

func (s *AuthService) generateToken(user *model.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_SECRET is not set")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string) (uint64, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return 0, fmt.Errorf("JWT_SECRET is not set")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID := uint64(claims["user_id"].(float64))
		return userID, nil
	}

	return 0, errors.New("invalid token")
}
