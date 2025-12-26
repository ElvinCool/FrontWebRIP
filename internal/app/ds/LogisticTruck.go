package ds

type LogisticTruck struct {
	ID             uint    `gorm:"primaryKey"`
	LogisticID     uint    `gorm:"not null;uniqueIndex:idx_logistic_truck"`
	TruckID        uint    `gorm:"not null;uniqueIndex:idx_logistic_truck"`
	CountLogistics int     `gorm:"type:integer"` // Количество машин
	Distance       float64 `gorm:"type:float"`  // Расстояние в километрах для расчета цены
	Price          float64 `gorm:"type:float"`
	Comment        string  `gorm:"type:varchar(255)"`
	
	Truck Truck `gorm:"foreignKey:TruckID"`
}
