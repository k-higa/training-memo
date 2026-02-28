package repository

import (
	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type MenuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) *MenuRepository {
	return &MenuRepository{db: db}
}

func (r *MenuRepository) Create(menu *model.Menu) error {
	return r.db.Create(menu).Error
}

func (r *MenuRepository) FindByID(id uint64) (*model.Menu, error) {
	var menu model.Menu
	err := r.db.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_number ASC")
	}).Preload("Items.Exercise").First(&menu, id).Error
	if err != nil {
		return nil, err
	}
	return &menu, nil
}

func (r *MenuRepository) FindByUserID(userID uint64) ([]model.Menu, error) {
	var menus []model.Menu
	err := r.db.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_number ASC")
	}).Preload("Items.Exercise").Where("user_id = ?", userID).Order("updated_at DESC").Find(&menus).Error
	if err != nil {
		return nil, err
	}
	return menus, nil
}

func (r *MenuRepository) Update(menu *model.Menu) error {
	return r.db.Save(menu).Error
}

func (r *MenuRepository) Delete(id uint64) error {
	return r.db.Delete(&model.Menu{}, id).Error
}

func (r *MenuRepository) AddItem(item *model.MenuItem) error {
	return r.db.Create(item).Error
}

func (r *MenuRepository) DeleteItemsByMenuID(menuID uint64) error {
	return r.db.Where("menu_id = ?", menuID).Delete(&model.MenuItem{}).Error
}

func (r *MenuRepository) CreateWithItems(menu *model.Menu, items []*model.MenuItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(menu).Error; err != nil {
			return err
		}
		for _, item := range items {
			item.MenuID = menu.ID
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *MenuRepository) ReplaceItemsByMenuID(menuID uint64, items []*model.MenuItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("menu_id = ?", menuID).Delete(&model.MenuItem{}).Error; err != nil {
			return err
		}
		for _, item := range items {
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
