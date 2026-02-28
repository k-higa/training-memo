package service

import (
	"errors"
	"fmt"

	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type MenuService struct {
	menuRepo     MenuRepository
	exerciseRepo ExerciseRepository
}

func NewMenuService(menuRepo MenuRepository, exerciseRepo ExerciseRepository) *MenuService {
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

type UpdateMenuInput = CreateMenuInput

func (s *MenuService) CreateMenu(userID uint64, input *CreateMenuInput) (*model.Menu, error) {
	menu := &model.Menu{
		UserID:      userID,
		Name:        input.Name,
		Description: input.Description,
	}

	items := make([]*model.MenuItem, len(input.Items))
	for i, itemInput := range input.Items {
		items[i] = &model.MenuItem{
			ExerciseID:   itemInput.ExerciseID,
			OrderNumber:  itemInput.OrderNumber,
			TargetSets:   itemInput.TargetSets,
			TargetReps:   itemInput.TargetReps,
			TargetWeight: itemInput.TargetWeight,
			Note:         itemInput.Note,
		}
	}

	if err := s.menuRepo.CreateWithItems(menu, items); err != nil {
		return nil, err
	}

	return s.menuRepo.FindByID(menu.ID)
}

func (s *MenuService) GetMenu(userID, menuID uint64) (*model.Menu, error) {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMenuNotFound
		}
		return nil, fmt.Errorf("finding menu: %w", err)
	}

	if menu.UserID != userID {
		return nil, ErrUnauthorized
	}

	return menu, nil
}

func (s *MenuService) GetMenus(userID uint64) ([]model.Menu, error) {
	return s.menuRepo.FindByUserID(userID)
}

func (s *MenuService) UpdateMenu(userID, menuID uint64, input *UpdateMenuInput) (*model.Menu, error) {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMenuNotFound
		}
		return nil, fmt.Errorf("finding menu: %w", err)
	}

	if menu.UserID != userID {
		return nil, ErrUnauthorized
	}

	menu.Name = input.Name
	menu.Description = input.Description

	if err := s.menuRepo.Update(menu); err != nil {
		return nil, err
	}

	items := make([]*model.MenuItem, len(input.Items))
	for i, itemInput := range input.Items {
		items[i] = &model.MenuItem{
			MenuID:       menuID,
			ExerciseID:   itemInput.ExerciseID,
			OrderNumber:  itemInput.OrderNumber,
			TargetSets:   itemInput.TargetSets,
			TargetReps:   itemInput.TargetReps,
			TargetWeight: itemInput.TargetWeight,
			Note:         itemInput.Note,
		}
	}

	if err := s.menuRepo.ReplaceItemsByMenuID(menuID, items); err != nil {
		return nil, err
	}

	return s.menuRepo.FindByID(menuID)
}

func (s *MenuService) DeleteMenu(userID, menuID uint64) error {
	menu, err := s.menuRepo.FindByID(menuID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrMenuNotFound
		}
		return fmt.Errorf("finding menu: %w", err)
	}

	if menu.UserID != userID {
		return ErrUnauthorized
	}

	return s.menuRepo.Delete(menuID)
}
