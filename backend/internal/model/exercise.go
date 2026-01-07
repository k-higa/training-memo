package model

import (
	"time"
)

type MuscleGroup string

const (
	MuscleGroupChest     MuscleGroup = "chest"
	MuscleGroupBack      MuscleGroup = "back"
	MuscleGroupShoulders MuscleGroup = "shoulders"
	MuscleGroupArms      MuscleGroup = "arms"
	MuscleGroupLegs      MuscleGroup = "legs"
	MuscleGroupAbs       MuscleGroup = "abs"
	MuscleGroupOther     MuscleGroup = "other"
)

type Exercise struct {
	ID          uint64      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string      `json:"name" gorm:"size:100;not null"`
	MuscleGroup MuscleGroup `json:"muscle_group" gorm:"type:enum('chest','back','shoulders','arms','legs','abs','other');not null"`
	IsCustom    bool        `json:"is_custom" gorm:"default:false"`
	UserID      *uint64     `json:"user_id"`
	CreatedAt   time.Time   `json:"created_at"`
}

func (Exercise) TableName() string {
	return "exercises"
}

