package service

import (
	"time"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint64) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Update(user *model.User) error
	ExistsByEmail(email string) (bool, error)
	DeleteWithAllData(userID uint64) error
}

type WorkoutRepository interface {
	FindByID(id uint64) (*model.Workout, error)
	CreateWithSets(workout *model.Workout, sets []*model.WorkoutSet) error
	FindByUserIDAndDate(userID uint64, date time.Time) (*model.Workout, error)
	FindByUserID(userID uint64, limit, offset int) ([]model.Workout, error)
	CountByUserID(userID uint64) (int64, error)
	Update(workout *model.Workout) error
	ReplaceSetsByWorkoutID(workoutID uint64, sets []*model.WorkoutSet) error
	Delete(id uint64) error
	FindByUserIDAndMonth(userID uint64, year, month int) ([]model.Workout, error)
	GetMuscleGroupStats(userID uint64) ([]repository.MuscleGroupStat, error)
	GetPersonalBests(userID uint64) ([]repository.PersonalBest, error)
	GetExerciseProgress(userID uint64, exerciseID uint64) ([]repository.ExerciseProgress, error)
}

type ExerciseRepository interface {
	FindAll(userID uint64) ([]model.Exercise, error)
	FindByMuscleGroup(muscleGroup model.MuscleGroup, userID uint64) ([]model.Exercise, error)
	FindByID(id uint64) (*model.Exercise, error)
	Create(exercise *model.Exercise) error
	Update(exercise *model.Exercise) error
	Delete(id uint64) error
	FindCustomByUserID(userID uint64) ([]model.Exercise, error)
	IsUsedInWorkouts(exerciseID uint64) (bool, error)
}

type MenuRepository interface {
	Create(menu *model.Menu) error
	FindByID(id uint64) (*model.Menu, error)
	FindByUserID(userID uint64) ([]model.Menu, error)
	Update(menu *model.Menu) error
	Delete(id uint64) error
	AddItem(item *model.MenuItem) error
	DeleteItemsByMenuID(menuID uint64) error
	CreateWithItems(menu *model.Menu, items []*model.MenuItem) error
	ReplaceItemsByMenuID(menuID uint64, items []*model.MenuItem) error
}

type BodyWeightRepository interface {
	Create(record *model.BodyWeight) error
	FindByID(id uint64) (*model.BodyWeight, error)
	FindByUserIDAndDate(userID uint64, date time.Time) (*model.BodyWeight, error)
	FindByUserID(userID uint64, limit int) ([]model.BodyWeight, error)
	FindByUserIDAndDateRange(userID uint64, startDate, endDate time.Time) ([]model.BodyWeight, error)
	Update(record *model.BodyWeight) error
	Delete(id uint64) error
	GetLatest(userID uint64) (*model.BodyWeight, error)
}
