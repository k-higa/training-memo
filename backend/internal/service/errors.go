package service

import "errors"

var (
	ErrUnauthorized      = errors.New("unauthorized")
	ErrInvalidDateFormat = errors.New("invalid date format")

	// User errors
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrUserNotFound       = errors.New("user not found")

	// Workout errors
	ErrWorkoutNotFound = errors.New("workout not found")

	// Exercise errors
	ErrExerciseNotFound  = errors.New("exercise not found")
	ErrExerciseInUse     = errors.New("exercise is in use")
	ErrNotCustomExercise = errors.New("cannot modify preset exercise")

	// Menu errors
	ErrMenuNotFound = errors.New("menu not found")

	// Body weight errors
	ErrBodyWeightNotFound = errors.New("body weight record not found")
)
