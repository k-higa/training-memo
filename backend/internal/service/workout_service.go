package service

import (
	"errors"
	"time"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

var (
	ErrWorkoutNotFound = errors.New("workout not found")
	ErrUnauthorized    = errors.New("unauthorized")
)

type WorkoutService struct {
	workoutRepo  *repository.WorkoutRepository
	exerciseRepo *repository.ExerciseRepository
}

func NewWorkoutService(workoutRepo *repository.WorkoutRepository, exerciseRepo *repository.ExerciseRepository) *WorkoutService {
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

type UpdateWorkoutInput struct {
	Memo *string          `json:"memo"`
	Sets []CreateSetInput `json:"sets" validate:"required,min=1,dive"`
}

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
		return nil, errors.New("invalid date format")
	}

	workout := &model.Workout{
		UserID: userID,
		Date:   date,
		Memo:   input.Memo,
	}

	if err := s.workoutRepo.Create(workout); err != nil {
		return nil, err
	}

	// セットを追加
	for _, setInput := range input.Sets {
		set := &model.WorkoutSet{
			WorkoutID:  workout.ID,
			ExerciseID: setInput.ExerciseID,
			SetNumber:  setInput.SetNumber,
			Weight:     setInput.Weight,
			Reps:       setInput.Reps,
		}
		if err := s.workoutRepo.AddSet(set); err != nil {
			return nil, err
		}
	}

	// セット情報を含めて再取得
	return s.workoutRepo.FindByID(workout.ID)
}

func (s *WorkoutService) GetWorkout(userID, workoutID uint64) (*model.Workout, error) {
	workout, err := s.workoutRepo.FindByID(workoutID)
	if err != nil {
		return nil, ErrWorkoutNotFound
	}

	if workout.UserID != userID {
		return nil, ErrUnauthorized
	}

	return workout, nil
}

func (s *WorkoutService) GetWorkoutByDate(userID uint64, date string) (*model.Workout, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, errors.New("invalid date format")
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
		return nil, ErrWorkoutNotFound
	}

	if workout.UserID != userID {
		return nil, ErrUnauthorized
	}

	workout.Memo = input.Memo

	if err := s.workoutRepo.Update(workout); err != nil {
		return nil, err
	}

	// 既存のセットを削除
	if err := s.workoutRepo.DeleteSetsByWorkoutID(workoutID); err != nil {
		return nil, err
	}

	// 新しいセットを追加
	for _, setInput := range input.Sets {
		set := &model.WorkoutSet{
			WorkoutID:  workoutID,
			ExerciseID: setInput.ExerciseID,
			SetNumber:  setInput.SetNumber,
			Weight:     setInput.Weight,
			Reps:       setInput.Reps,
		}
		if err := s.workoutRepo.AddSet(set); err != nil {
			return nil, err
		}
	}

	return s.workoutRepo.FindByID(workoutID)
}

func (s *WorkoutService) DeleteWorkout(userID, workoutID uint64) error {
	workout, err := s.workoutRepo.FindByID(workoutID)
	if err != nil {
		return ErrWorkoutNotFound
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

