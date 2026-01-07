package service

import (
	"errors"
	"time"

	"github.com/training-memo/backend/internal/model"
	"github.com/training-memo/backend/internal/repository"
)

var (
	ErrBodyWeightNotFound = errors.New("body weight record not found")
)

type BodyWeightService struct {
	bodyWeightRepo *repository.BodyWeightRepository
}

func NewBodyWeightService(bodyWeightRepo *repository.BodyWeightRepository) *BodyWeightService {
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
		return nil, errors.New("invalid date format")
	}

	// 同日の記録があれば更新
	existing, err := s.bodyWeightRepo.FindByUserIDAndDate(userID, date)
	if err == nil && existing != nil {
		existing.Weight = input.Weight
		existing.BodyFatPercentage = input.BodyFatPercentage
		if err := s.bodyWeightRepo.Update(existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	// 新規作成
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

func (s *BodyWeightService) GetRecords(userID uint64, limit int) ([]model.BodyWeight, error) {
	return s.bodyWeightRepo.FindByUserID(userID, limit)
}

func (s *BodyWeightService) GetRecordsByDateRange(userID uint64, startDate, endDate string) ([]model.BodyWeight, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, errors.New("invalid start date format")
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, errors.New("invalid end date format")
	}

	return s.bodyWeightRepo.FindByUserIDAndDateRange(userID, start, end)
}

func (s *BodyWeightService) GetLatest(userID uint64) (*model.BodyWeight, error) {
	return s.bodyWeightRepo.GetLatest(userID)
}

func (s *BodyWeightService) Delete(userID uint64, recordID uint64) error {
	record, err := s.bodyWeightRepo.FindByID(recordID)
	if err != nil {
		return ErrBodyWeightNotFound
	}

	if record.UserID != userID {
		return ErrUnauthorized
	}

	return s.bodyWeightRepo.Delete(recordID)
}

