package repository

import (
	"RIP/internal/app/ds"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

func (r *Repository) GetTrucks() ([]ds.Truck, error) {
	var trucks []ds.Truck
	err := r.db.Find(&trucks).Error
	if err != nil {
		return nil, err
	}
	if len(trucks) == 0 {
		return nil, fmt.Errorf("массив пустой")
	}
	return trucks, nil
}

func (r *Repository) GetTruck(id int) (*ds.Truck, error) {
	query := `
		SELECT 
			id, 
			title, 
			preview, 
			img_url, 
			description, 
			weight, 
			price, 
			length, 
			width, 
			height, 
			year
		FROM trucks
		WHERE id = $1
	`

	row := r.db.Raw(query, id).Row()

	truck := &ds.Truck{}

	err := row.Scan(
		&truck.ID,
		&truck.Title,
		&truck.Preview,
		&truck.ImgURL,
		&truck.Description,
		&truck.Weight,
		&truck.Price,
		&truck.Length,
		&truck.Width,
		&truck.Height,
		&truck.Year,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return truck, nil
}

func (r *Repository) GetTrucksByTitle(title string) ([]ds.Truck, error) {
	var trucks []ds.Truck
	err := r.db.Where("title ILIKE ?", "%"+title+"%").Find(&trucks).Error
	if err != nil {
		return nil, err
	}
	return trucks, nil
}

//API!!!

func (r *Repository) GetTrucksFiltered(title, status string) ([]ds.Truck, error) {
	db := r.db.Model(&ds.Truck{})

	if title != "" {
		db = db.Where("LOWER(title) LIKE ?", "%"+strings.ToLower(title)+"%")
	}

	if status != "" {
		db = db.Where("status = ?", status)
	} else {
		db = db.Where("status != ?", "deleted")
	}

	var trucks []ds.Truck
	if err := db.Find(&trucks).Error; err != nil {
		return nil, err
	}
	return trucks, nil
}

func (r *Repository) GetTruckByID(id uint) (*ds.Truck, error) {
	var truck ds.Truck
	if err := r.db.First(&truck, id).Error; err != nil {
		return nil, err
	}
	return &truck, nil
}

func (r *Repository) CreateTruck(truck *ds.Truck) error {
	return r.db.Create(truck).Error
}

func (r *Repository) UpdateTruck(id uint, data map[string]interface{}) error {
	return r.db.Model(&ds.Truck{}).Where("id = ?", id).Updates(data).Error
}

func (r *Repository) DeleteTruckByID(id uint) error {
	result := r.db.Delete(&ds.Truck{}, id)
	return result.Error
}
