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

// FindByUserIDAndMonth は指定月のワークアウトを取得
func (r *WorkoutRepository) FindByUserIDAndMonth(userID uint64, year, month int) ([]model.Workout, error) {
	var workouts []model.Workout
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, 0)

	if err := r.db.Preload("Sets").Preload("Sets.Exercise").
		Where("user_id = ? AND date >= ? AND date < ?", userID, startDate, endDate).
		Order("date ASC").
		Find(&workouts).Error; err != nil {
		return nil, err
	}
	return workouts, nil
}

// GetExerciseStats は種目別の統計を取得
func (r *WorkoutRepository) GetExerciseStats(userID uint64, exerciseID uint64, limit int) ([]model.WorkoutSet, error) {
	var sets []model.WorkoutSet
	if err := r.db.
		Joins("JOIN workouts ON workouts.id = workout_sets.workout_id").
		Where("workouts.user_id = ? AND workout_sets.exercise_id = ?", userID, exerciseID).
		Order("workouts.date DESC").
		Limit(limit).
		Find(&sets).Error; err != nil {
		return nil, err
	}
	return sets, nil
}

// GetMuscleGroupStats は部位別のトレーニング回数を取得
func (r *WorkoutRepository) GetMuscleGroupStats(userID uint64) ([]MuscleGroupStat, error) {
	var stats []MuscleGroupStat
	if err := r.db.Table("workout_sets").
		Select("exercises.muscle_group, COUNT(DISTINCT workouts.date) as workout_count, COUNT(*) as set_count").
		Joins("JOIN workouts ON workouts.id = workout_sets.workout_id").
		Joins("JOIN exercises ON exercises.id = workout_sets.exercise_id").
		Where("workouts.user_id = ?", userID).
		Group("exercises.muscle_group").
		Scan(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// GetPersonalBests は種目ごとの自己ベスト（最大重量）を取得
func (r *WorkoutRepository) GetPersonalBests(userID uint64) ([]PersonalBest, error) {
	var bests []PersonalBest
	if err := r.db.Table("workout_sets").
		Select("exercises.id as exercise_id, exercises.name as exercise_name, exercises.muscle_group, MAX(workout_sets.weight) as max_weight").
		Joins("JOIN workouts ON workouts.id = workout_sets.workout_id").
		Joins("JOIN exercises ON exercises.id = workout_sets.exercise_id").
		Where("workouts.user_id = ?", userID).
		Group("exercises.id, exercises.name, exercises.muscle_group").
		Having("MAX(workout_sets.weight) > 0").
		Order("exercises.muscle_group, exercises.name").
		Scan(&bests).Error; err != nil {
		return nil, err
	}
	return bests, nil
}

// GetExerciseProgress は種目の重量推移を取得
func (r *WorkoutRepository) GetExerciseProgress(userID uint64, exerciseID uint64) ([]ExerciseProgress, error) {
	var progress []ExerciseProgress
	if err := r.db.Table("workout_sets").
		Select("workouts.date, MAX(workout_sets.weight) as max_weight, SUM(workout_sets.weight * workout_sets.reps) as total_volume").
		Joins("JOIN workouts ON workouts.id = workout_sets.workout_id").
		Where("workouts.user_id = ? AND workout_sets.exercise_id = ?", userID, exerciseID).
		Group("workouts.date").
		Order("workouts.date ASC").
		Scan(&progress).Error; err != nil {
		return nil, err
	}
	return progress, nil
}

type MuscleGroupStat struct {
	MuscleGroup  string `json:"muscle_group"`
	WorkoutCount int    `json:"workout_count"`
	SetCount     int    `json:"set_count"`
}

type PersonalBest struct {
	ExerciseID   uint64  `json:"exercise_id"`
	ExerciseName string  `json:"exercise_name"`
	MuscleGroup  string  `json:"muscle_group"`
	MaxWeight    float64 `json:"max_weight"`
}

type ExerciseProgress struct {
	Date        time.Time `json:"date"`
	MaxWeight   float64   `json:"max_weight"`
	TotalVolume float64   `json:"total_volume"`
}

