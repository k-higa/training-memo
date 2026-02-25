package repository

import (
	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uint64) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	if err := r.db.Model(&model.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// DeleteWithAllData はユーザーに関連する全データをトランザクションで削除する
func (r *UserRepository) DeleteWithAllData(userID uint64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// workout_sets（workoutsを通じてuserに紐づく）
		if err := tx.Exec("DELETE FROM workout_sets WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?)", userID).Error; err != nil {
			return err
		}
		// workouts
		if err := tx.Where("user_id = ?", userID).Delete(&model.Workout{}).Error; err != nil {
			return err
		}
		// menu_items（menusを通じてuserに紐づく）
		if err := tx.Exec("DELETE FROM menu_items WHERE menu_id IN (SELECT id FROM menus WHERE user_id = ?)", userID).Error; err != nil {
			return err
		}
		// menus
		if err := tx.Where("user_id = ?", userID).Delete(&model.Menu{}).Error; err != nil {
			return err
		}
		// body_weights
		if err := tx.Where("user_id = ?", userID).Delete(&model.BodyWeight{}).Error; err != nil {
			return err
		}
		// カスタム種目
		if err := tx.Where("user_id = ? AND is_custom = true", userID).Delete(&model.Exercise{}).Error; err != nil {
			return err
		}
		// ユーザー本体
		if err := tx.Delete(&model.User{}, userID).Error; err != nil {
			return err
		}
		return nil
	})
}

