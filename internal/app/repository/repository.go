package repository

import (
	"RIP/internal/app/ds"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Repository — базовый тип, содержащий подключение к БД.
type Repository struct {
	db    *gorm.DB
	Minio *MinioClient
}

// New — конструктор, создаёт подключение к PostgreSQL и возвращает объект Repository.
func New(dsn string) (*Repository, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	minioClient := NewMinioClient()

	return &Repository{db: db, Minio: minioClient}, nil
}

func (r *Repository) MarkLogisticDeleted(id uint) error {
	return r.db.Model(&ds.Logistic{}).Where("id = ?", id).Update("status", "удален").Error
}
