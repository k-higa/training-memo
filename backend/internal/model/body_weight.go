package model

import (
	"time"
)

// BodyWeight は体重記録を表す
type BodyWeight struct {
	ID                uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID            uint64    `json:"user_id" gorm:"not null;index"`
	Date              time.Time `json:"date" gorm:"type:date;not null"`
	Weight            float64   `json:"weight" gorm:"type:decimal(5,2);not null"`
	BodyFatPercentage *float64  `json:"body_fat_percentage" gorm:"type:decimal(4,1)"`
	CreatedAt         time.Time `json:"created_at"`
}

func (BodyWeight) TableName() string {
	return "body_weights"
}

