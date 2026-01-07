package service

import (
	"errors"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

var (
	ErrMenuNotFound = errors.New("menu not found")
)

type MenuService struct {
	menuRepo     *repository.MenuRepository
	exerciseRepo *repository.ExerciseRepository
}

func NewMenuService(menuRepo *repository.MenuRepository, exerciseRepo *repository.ExerciseRepository) *MenuService {
	return &MenuService{
		menuRepo:     menuRepo,
		exerciseRepo: exerciseRepo,
	}
}

type CreateMenuInput struct {
	Name        string            `json:"name" validate:"required,min=1,max=100"`
	Description *string           `json:"description"`
	Items       []CreateItemInput `json:"items" validate:"required,min=1,dive"`
}

type CreateItemInput struct {
	ExerciseID   uint64   `json:"exercise_id" validate:"required"`
	OrderNumber  uint8    `json:"order_number" validate:"required,min=1"`
	TargetSets   uint8    `json:"target_sets" validate:"required,min=1"`
	TargetReps   uint16   `json:"target_reps" validate:"required,min=1"`
	TargetWeight *float64 `json:"target_weight"`
	Note         *string  `json:"note"`
}

func (s *MenuService) CreateMenu(userID uint64, input *CreateMenuInput) (*model.Menu, error) {
	menu := &model.Menu{
		UserID:      userID,
		Name:        input.Name,
		Description: input.Description,
	}

	if err := s.menuRepo.Create(menu); err != nil {
		return nil, err
	}

	// アイテムを追加
	for _, itemInput := range input.Items {
		item := &model.MenuItem{
			MenuID:       menu.ID,
			ExerciseID:   itemInput.ExerciseID,
			OrderNumber:  itemInput.OrderNumber,
			TargetSets:   itemInput.TargetSets,
			TargetReps:   itemInput.TargetReps,
			TargetWeight: itemInput.TargetWeight,
			Note:         itemInput.Note,
		}
		if err := s.menuRepo.AddItem(item); err != nil {
			return nil, err
		}
	}

	// 再取得
	return s.menuRepo.FindByID(menu.ID)
}

func (s *MenuService) GetMenu(userID, menuID uint64) (*model.Menu, error) {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		return nil, ErrMenuNotFound
	}

	if menu.UserID != userID {
		return nil, ErrUnauthorized
	}

	return menu, nil
}

func (s *MenuService) GetMenus(userID uint64) ([]model.Menu, error) {
	return s.menuRepo.FindByUserID(userID)
}

func (s *MenuService) UpdateMenu(userID, menuID uint64, input *CreateMenuInput) (*model.Menu, error) {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		return nil, ErrMenuNotFound
	}

	if menu.UserID != userID {
		return nil, ErrUnauthorized
	}

	menu.Name = input.Name
	menu.Description = input.Description

	if err := s.menuRepo.Update(menu); err != nil {
		return nil, err
	}

	// 既存のアイテムを削除
	if err := s.menuRepo.DeleteItemsByMenuID(menuID); err != nil {
		return nil, err
	}

	// 新しいアイテムを追加
	for _, itemInput := range input.Items {
		item := &model.MenuItem{
			MenuID:       menuID,
			ExerciseID:   itemInput.ExerciseID,
			OrderNumber:  itemInput.OrderNumber,
			TargetSets:   itemInput.TargetSets,
			TargetReps:   itemInput.TargetReps,
			TargetWeight: itemInput.TargetWeight,
			Note:         itemInput.Note,
		}
		if err := s.menuRepo.AddItem(item); err != nil {
			return nil, err
		}
	}

	return s.menuRepo.FindByID(menuID)
}

func (s *MenuService) DeleteMenu(userID, menuID uint64) error {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		return ErrMenuNotFound
	}

	if menu.UserID != userID {
		return ErrUnauthorized
	}

	return s.menuRepo.Delete(menuID)
}

