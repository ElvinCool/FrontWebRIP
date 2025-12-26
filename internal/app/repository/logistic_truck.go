package repository

import (
	"RIP/internal/app/ds"
	"errors"
)

func (r *Repository) DeleteLogisticTruck(logisticID, truckID uint) error {
	res := r.db.Where("logistic_id = ? AND truck_id = ?", logisticID, truckID).Delete(&ds.LogisticTruck{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("запись не найдена")
	}
	return nil
}

func (r *Repository) UpdateLogisticTruck(logisticID, truckID uint, count int, price float64, comment string) error {
	var lt ds.LogisticTruck
	if err := r.db.Where("logistic_id = ? AND truck_id = ?", logisticID, truckID).First(&lt).Error; err != nil {
		return err
	}

	lt.CountLogistics = count
	lt.Price = price
	lt.Comment = comment

	return r.db.Save(&lt).Error
}

// UpdateLogisticTruckPrice обновляет только цену LogisticTruck по его ID
func (r *Repository) UpdateLogisticTruckPrice(id uint, price float64) error {
	var lt ds.LogisticTruck
	if err := r.db.First(&lt, id).Error; err != nil {
		return err
	}

	lt.Price = price
	return r.db.Save(&lt).Error
}
