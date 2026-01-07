package model

import (
	"time"
)

type User struct {
	ID           uint64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Email        string     `json:"email" gorm:"uniqueIndex;size:255;not null"`
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	Name         string     `json:"name" gorm:"size:100;not null"`
	Height       *float64   `json:"height" gorm:"type:decimal(5,2)"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

