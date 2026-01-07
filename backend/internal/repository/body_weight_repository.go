package repository

import (
	"time"

	"github.com/training-memo/backend/internal/model"
	"gorm.io/gorm"
)

type BodyWeightRepository struct {
	db *gorm.DB
}

func NewBodyWeightRepository(db *gorm.DB) *BodyWeightRepository {
	return &BodyWeightRepository{db: db}
}

func (r *BodyWeightRepository) Create(record *model.BodyWeight) error {
	return r.db.Create(record).Error
}

func (r *BodyWeightRepository) FindByID(id uint64) (*model.BodyWeight, error) {
	var record model.BodyWeight
	err := r.db.First(&record, id).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *BodyWeightRepository) FindByUserIDAndDate(userID uint64, date time.Time) (*model.BodyWeight, error) {
	var record model.BodyWeight
	err := r.db.Where("user_id = ? AND date = ?", userID, date.Format("2006-01-02")).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *BodyWeightRepository) FindByUserID(userID uint64, limit int) ([]model.BodyWeight, error) {
	var records []model.BodyWeight
	query := r.db.Where("user_id = ?", userID).Order("date DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&records).Error
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (r *BodyWeightRepository) FindByUserIDAndDateRange(userID uint64, startDate, endDate time.Time) ([]model.BodyWeight, error) {
	var records []model.BodyWeight
	err := r.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02")).Order("date ASC").Find(&records).Error
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (r *BodyWeightRepository) Update(record *model.BodyWeight) error {
	return r.db.Save(record).Error
}

func (r *BodyWeightRepository) Delete(id uint64) error {
	return r.db.Delete(&model.BodyWeight{}, id).Error
}

func (r *BodyWeightRepository) GetLatest(userID uint64) (*model.BodyWeight, error) {
	var record model.BodyWeight
	err := r.db.Where("user_id = ?", userID).Order("date DESC").First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

