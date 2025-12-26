package ds

import (
	"database/sql"
	"time"
)

type Logistic struct {
	ID          uint      `gorm:"primaryKey"`
	Status      string    `gorm:"type:varchar(20);not null"`
	DateCreate  time.Time `gorm:"not null"`
	DateUpdate  time.Time
	DateFinish  sql.NullTime
	CreatorID   uint
	ModeratorID sql.NullInt64

	// Связи
	Creator   User `gorm:"foreignKey:CreatorID"`
	Moderator User `gorm:"foreignKey:ModeratorID"`

	LogisticTrucks []LogisticTruck `gorm:"foreignKey:LogisticID"`
}
