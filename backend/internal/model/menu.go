package model

import (
	"time"
)

// Menu はトレーニングメニュー（テンプレート）を表す
type Menu struct {
	ID          uint64     `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint64     `json:"user_id" gorm:"not null;index"`
	Name        string     `json:"name" gorm:"type:varchar(255);not null"`
	Description *string    `json:"description" gorm:"type:text"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Items       []MenuItem `json:"items,omitempty" gorm:"foreignKey:MenuID"`
}

func (Menu) TableName() string {
	return "menus"
}

// MenuItem はメニュー内の種目設定を表す
type MenuItem struct {
	ID           uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	MenuID       uint64    `json:"menu_id" gorm:"not null;index"`
	ExerciseID   uint64    `json:"exercise_id" gorm:"not null;index"`
	OrderNumber  uint8     `json:"order_number" gorm:"not null"`
	TargetSets   uint8     `json:"target_sets" gorm:"not null;default:3"`
	TargetReps   uint16    `json:"target_reps" gorm:"not null;default:10"`
	TargetWeight *float64  `json:"target_weight" gorm:"type:decimal(6,2)"`
	Note         *string   `json:"note" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at"`
	Exercise     *Exercise `json:"exercise,omitempty" gorm:"foreignKey:ExerciseID"`
}

func (MenuItem) TableName() string {
	return "menu_items"
}

