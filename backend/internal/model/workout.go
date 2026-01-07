package model

import (
	"time"
)

type Workout struct {
	ID        uint64       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint64       `json:"user_id" gorm:"not null;index"`
	Date      time.Time    `json:"date" gorm:"type:date;not null"`
	Memo      *string      `json:"memo" gorm:"type:text"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	Sets      []WorkoutSet `json:"sets,omitempty" gorm:"foreignKey:WorkoutID"`
}

func (Workout) TableName() string {
	return "workouts"
}

type WorkoutSet struct {
	ID         uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	WorkoutID  uint64    `json:"workout_id" gorm:"not null;index"`
	ExerciseID uint64    `json:"exercise_id" gorm:"not null;index"`
	SetNumber  uint8     `json:"set_number" gorm:"not null"`
	Weight     float64   `json:"weight" gorm:"type:decimal(6,2);not null"`
	Reps       uint16    `json:"reps" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at"`
	Exercise   *Exercise `json:"exercise,omitempty" gorm:"foreignKey:ExerciseID"`
}

func (WorkoutSet) TableName() string {
	return "workout_sets"
}

