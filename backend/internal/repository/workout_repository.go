package repository

import (
	"time"

	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type WorkoutRepository struct {
	db *gorm.DB
}

func NewWorkoutRepository(db *gorm.DB) *WorkoutRepository {
	return &WorkoutRepository{db: db}
}

func (r *WorkoutRepository) Create(workout *model.Workout) error {
	return r.db.Create(workout).Error
}

func (r *WorkoutRepository) FindByID(id uint64) (*model.Workout, error) {
	var workout model.Workout
	if err := r.db.Preload("Sets").Preload("Sets.Exercise").First(&workout, id).Error; err != nil {
		return nil, err
	}
	return &workout, nil
}

func (r *WorkoutRepository) FindByUserIDAndDate(userID uint64, date time.Time) (*model.Workout, error) {
	var workout model.Workout
	if err := r.db.Preload("Sets").Preload("Sets.Exercise").
		Where("user_id = ? AND date = ?", userID, date.Format("2006-01-02")).
		First(&workout).Error; err != nil {
		return nil, err
	}
	return &workout, nil
}

func (r *WorkoutRepository) FindByUserID(userID uint64, limit, offset int) ([]model.Workout, error) {
	var workouts []model.Workout
	if err := r.db.Preload("Sets").Preload("Sets.Exercise").
		Where("user_id = ?", userID).
		Order("date DESC").
		Limit(limit).
		Offset(offset).
		Find(&workouts).Error; err != nil {
		return nil, err
	}
	return workouts, nil
}

func (r *WorkoutRepository) CountByUserID(userID uint64) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Workout{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WorkoutRepository) Update(workout *model.Workout) error {
	return r.db.Save(workout).Error
}

func (r *WorkoutRepository) Delete(id uint64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// セットを先に削除
		if err := tx.Where("workout_id = ?", id).Delete(&model.WorkoutSet{}).Error; err != nil {
			return err
		}
		// ワークアウトを削除
		return tx.Delete(&model.Workout{}, id).Error
	})
}

func (r *WorkoutRepository) AddSet(set *model.WorkoutSet) error {
	return r.db.Create(set).Error
}

func (r *WorkoutRepository) UpdateSet(set *model.WorkoutSet) error {
	return r.db.Save(set).Error
}

func (r *WorkoutRepository) DeleteSet(id uint64) error {
	return r.db.Delete(&model.WorkoutSet{}, id).Error
}

func (r *WorkoutRepository) DeleteSetsByWorkoutID(workoutID uint64) error {
	return r.db.Where("workout_id = ?", workoutID).Delete(&model.WorkoutSet{}).Error
}

