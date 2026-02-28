package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type BodyWeightService struct {
	bodyWeightRepo BodyWeightRepository
}

func NewBodyWeightService(bodyWeightRepo BodyWeightRepository) *BodyWeightService {
	return &BodyWeightService{
		bodyWeightRepo: bodyWeightRepo,
	}
}

type CreateBodyWeightInput struct {
	Date              string   `json:"date" validate:"required"`
	Weight            float64  `json:"weight" validate:"required,min=0.1,max=500"`
	BodyFatPercentage *float64 `json:"body_fat_percentage"`
}

type BodyWeightListResponse struct {
	Records []model.BodyWeight `json:"records"`
}

func (s *BodyWeightService) CreateOrUpdate(userID uint64, input *CreateBodyWeightInput) (*model.BodyWeight, error) {
	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidDateFormat, input.Date)
	}

	existing, err := s.bodyWeightRepo.FindByUserIDAndDate(userID, date)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("finding body weight record: %w", err)
		}
		// not found → create new
		record := &model.BodyWeight{
			UserID:            userID,
			Date:              date,
			Weight:            input.Weight,
			BodyFatPercentage: input.BodyFatPercentage,
		}
		if err := s.bodyWeightRepo.Create(record); err != nil {
			return nil, err
		}
		return record, nil
	}

	// found → update
	existing.Weight = input.Weight
	existing.BodyFatPercentage = input.BodyFatPercentage
	if err := s.bodyWeightRepo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *BodyWeightService) GetRecords(userID uint64, limit int) ([]model.BodyWeight, error) {
	return s.bodyWeightRepo.FindByUserID(userID, limit)
}

func (s *BodyWeightService) GetRecordsByDateRange(userID uint64, startDate, endDate string) ([]model.BodyWeight, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidDateFormat, startDate)
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidDateFormat, endDate)
	}

	return s.bodyWeightRepo.FindByUserIDAndDateRange(userID, start, end)
}

func (s *BodyWeightService) GetLatest(userID uint64) (*model.BodyWeight, error) {
	return s.bodyWeightRepo.GetLatest(userID)
}

func (s *BodyWeightService) Delete(userID uint64, recordID uint64) error {
	record, err := s.bodyWeightRepo.FindByID(recordID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrBodyWeightNotFound
		}
		return fmt.Errorf("finding body weight record: %w", err)
	}

	if record.UserID != userID {
		return ErrUnauthorized
	}

	return s.bodyWeightRepo.Delete(recordID)
}
