package repository

import (
	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type ExerciseRepository struct {
	db *gorm.DB
}

func NewExerciseRepository(db *gorm.DB) *ExerciseRepository {
	return &ExerciseRepository{db: db}
}

func (r *ExerciseRepository) FindAll(userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	// プリセット種目 + ユーザーのカスタム種目
	if err := r.db.Where("is_custom = ? OR user_id = ?", false, userID).
		Order("muscle_group, name").
		Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepository) FindByID(id uint64) (*model.Exercise, error) {
	var exercise model.Exercise
	if err := r.db.First(&exercise, id).Error; err != nil {
		return nil, err
	}
	return &exercise, nil
}

func (r *ExerciseRepository) FindByMuscleGroup(muscleGroup model.MuscleGroup, userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	if err := r.db.Where("muscle_group = ? AND (is_custom = ? OR user_id = ?)", muscleGroup, false, userID).
		Order("name").
		Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepository) Create(exercise *model.Exercise) error {
	return r.db.Create(exercise).Error
}

