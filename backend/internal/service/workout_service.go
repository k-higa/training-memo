package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
	"gorm.io/gorm"
)

type WorkoutService struct {
	workoutRepo  WorkoutRepository
	exerciseRepo ExerciseRepository
}

func NewWorkoutService(workoutRepo WorkoutRepository, exerciseRepo ExerciseRepository) *WorkoutService {
	return &WorkoutService{
		workoutRepo:  workoutRepo,
		exerciseRepo: exerciseRepo,
	}
}

type CreateWorkoutInput struct {
	Date string           `json:"date" validate:"required"`
	Memo *string          `json:"memo"`
	Sets []CreateSetInput `json:"sets" validate:"required,min=1,dive"`
}

type CreateSetInput struct {
	ExerciseID uint64  `json:"exercise_id" validate:"required"`
	SetNumber  uint8   `json:"set_number" validate:"required,min=1"`
	Weight     float64 `json:"weight" validate:"required,min=0"`
	Reps       uint16  `json:"reps" validate:"required,min=1"`
}

type UpdateSetInput = CreateSetInput

type UpdateWorkoutInput struct {
	Memo *string          `json:"memo"`
	Sets []UpdateSetInput `json:"sets" validate:"required,min=1,dive"`
}

type CreateExerciseInput struct {
	Name        string `json:"name" validate:"required,min=1,max=100"`
	MuscleGroup string `json:"muscle_group" validate:"required"`
}

type UpdateExerciseInput = CreateExerciseInput

type WorkoutListResponse struct {
	Workouts   []model.Workout `json:"workouts"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PerPage    int             `json:"per_page"`
	TotalPages int             `json:"total_pages"`
}

func (s *WorkoutService) CreateWorkout(userID uint64, input *CreateWorkoutInput) (*model.Workout, error) {
	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidDateFormat, input.Date)
	}

	workout := &model.Workout{
		UserID: userID,
		Date:   date,
		Memo:   input.Memo,
	}

	sets := make([]*model.WorkoutSet, len(input.Sets))
	for i, setInput := range input.Sets {
		sets[i] = &model.WorkoutSet{
			ExerciseID: setInput.ExerciseID,
			SetNumber:  setInput.SetNumber,
			Weight:     setInput.Weight,
			Reps:       setInput.Reps,
		}
	}

	if err := s.workoutRepo.CreateWithSets(workout, sets); err != nil {
		return nil, err
	}

	return s.workoutRepo.FindByID(workout.ID)
}

func (s *WorkoutService) GetWorkout(userID, workoutID uint64) (*model.Workout, error) {
	workout, err := s.workoutRepo.FindByID(workoutID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkoutNotFound
		}
		return nil, fmt.Errorf("finding workout: %w", err)
	}

	if workout.UserID != userID {
		return nil, ErrUnauthorized
	}

	return workout, nil
}

func (s *WorkoutService) GetWorkoutByDate(userID uint64, date string) (*model.Workout, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidDateFormat, date)
	}

	return s.workoutRepo.FindByUserIDAndDate(userID, dateTime)
}

func (s *WorkoutService) GetWorkoutList(userID uint64, page, perPage int) (*WorkoutListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	workouts, err := s.workoutRepo.FindByUserID(userID, perPage, offset)
	if err != nil {
		return nil, err
	}

	total, err := s.workoutRepo.CountByUserID(userID)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}

	return &WorkoutListResponse{
		Workouts:   workouts,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

func (s *WorkoutService) UpdateWorkout(userID, workoutID uint64, input *UpdateWorkoutInput) (*model.Workout, error) {
	workout, err := s.workoutRepo.FindByID(workoutID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkoutNotFound
		}
		return nil, fmt.Errorf("finding workout: %w", err)
	}

	if workout.UserID != userID {
		return nil, ErrUnauthorized
	}

	workout.Memo = input.Memo

	if err := s.workoutRepo.Update(workout); err != nil {
		return nil, err
	}

	sets := make([]*model.WorkoutSet, len(input.Sets))
	for i, setInput := range input.Sets {
		sets[i] = &model.WorkoutSet{
			WorkoutID:  workoutID,
			ExerciseID: setInput.ExerciseID,
			SetNumber:  setInput.SetNumber,
			Weight:     setInput.Weight,
			Reps:       setInput.Reps,
		}
	}

	if err := s.workoutRepo.ReplaceSetsByWorkoutID(workoutID, sets); err != nil {
		return nil, err
	}

	return s.workoutRepo.FindByID(workoutID)
}

func (s *WorkoutService) DeleteWorkout(userID, workoutID uint64) error {
	workout, err := s.workoutRepo.FindByID(workoutID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrWorkoutNotFound
		}
		return fmt.Errorf("finding workout: %w", err)
	}

	if workout.UserID != userID {
		return ErrUnauthorized
	}

	return s.workoutRepo.Delete(workoutID)
}

func (s *WorkoutService) GetExercises(userID uint64) ([]model.Exercise, error) {
	return s.exerciseRepo.FindAll(userID)
}

func (s *WorkoutService) GetExercisesByMuscleGroup(userID uint64, muscleGroup string) ([]model.Exercise, error) {
	return s.exerciseRepo.FindByMuscleGroup(model.MuscleGroup(muscleGroup), userID)
}

// カレンダー用：月別ワークアウト取得
func (s *WorkoutService) GetWorkoutsByMonth(userID uint64, year, month int) ([]model.Workout, error) {
	return s.workoutRepo.FindByUserIDAndMonth(userID, year, month)
}

// 統計：部位別集計
func (s *WorkoutService) GetMuscleGroupStats(userID uint64) ([]repository.MuscleGroupStat, error) {
	return s.workoutRepo.GetMuscleGroupStats(userID)
}

// 統計：自己ベスト一覧
func (s *WorkoutService) GetPersonalBests(userID uint64) ([]repository.PersonalBest, error) {
	return s.workoutRepo.GetPersonalBests(userID)
}

// 統計：種目の重量推移
func (s *WorkoutService) GetExerciseProgress(userID uint64, exerciseID uint64) ([]repository.ExerciseProgress, error) {
	return s.workoutRepo.GetExerciseProgress(userID, exerciseID)
}

// カスタム種目作成
func (s *WorkoutService) CreateCustomExercise(userID uint64, input *CreateExerciseInput) (*model.Exercise, error) {
	exercise := &model.Exercise{
		Name:        input.Name,
		MuscleGroup: model.MuscleGroup(input.MuscleGroup),
		IsCustom:    true,
		UserID:      &userID,
	}

	if err := s.exerciseRepo.Create(exercise); err != nil {
		return nil, err
	}

	return exercise, nil
}

func (s *WorkoutService) GetCustomExercises(userID uint64) ([]model.Exercise, error) {
	return s.exerciseRepo.FindCustomByUserID(userID)
}

func (s *WorkoutService) UpdateCustomExercise(userID uint64, exerciseID uint64, input *UpdateExerciseInput) (*model.Exercise, error) {
	exercise, err := s.exerciseRepo.FindByID(exerciseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrExerciseNotFound
		}
		return nil, fmt.Errorf("finding exercise: %w", err)
	}

	if !exercise.IsCustom || exercise.UserID == nil || *exercise.UserID != userID {
		return nil, ErrNotCustomExercise
	}

	exercise.Name = input.Name
	exercise.MuscleGroup = model.MuscleGroup(input.MuscleGroup)

	if err := s.exerciseRepo.Update(exercise); err != nil {
		return nil, err
	}

	return exercise, nil
}

func (s *WorkoutService) DeleteCustomExercise(userID uint64, exerciseID uint64) error {
	exercise, err := s.exerciseRepo.FindByID(exerciseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrExerciseNotFound
		}
		return fmt.Errorf("finding exercise: %w", err)
	}

	if !exercise.IsCustom || exercise.UserID == nil || *exercise.UserID != userID {
		return ErrNotCustomExercise
	}

	inUse, err := s.exerciseRepo.IsUsedInWorkouts(exerciseID)
	if err != nil {
		return err
	}
	if inUse {
		return ErrExerciseInUse
	}

	return s.exerciseRepo.Delete(exerciseID)
}
