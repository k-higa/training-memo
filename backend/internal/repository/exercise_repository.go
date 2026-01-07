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

func (r *ExerciseRepository) Update(exercise *model.Exercise) error {
	return r.db.Save(exercise).Error
}

func (r *ExerciseRepository) Delete(id uint64) error {
	return r.db.Delete(&model.Exercise{}, id).Error
}

func (r *ExerciseRepository) FindCustomByUserID(userID uint64) ([]model.Exercise, error) {
	var exercises []model.Exercise
	if err := r.db.Where("is_custom = ? AND user_id = ?", true, userID).
		Order("muscle_group, name").
		Find(&exercises).Error; err != nil {
		return nil, err
	}
	return exercises, nil
}

func (r *ExerciseRepository) IsUsedInWorkouts(exerciseID uint64) (bool, error) {
	var count int64
	if err := r.db.Model(&model.WorkoutSet{}).Where("exercise_id = ?", exerciseID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

