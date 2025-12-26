package ds

type Truck struct {
	ID          uint    `gorm:"primaryKey"`
	Title       string  `gorm:"type:varchar(90);not null"`
	Preview     string  `gorm:"type:varchar(140)"`
	ImgURL      string  `gorm:"type:varchar(140)"`
	Description string  `gorm:"type:varchar(255)"`
	Weight      float64 `gorm:"type:float"`
	Price       float64 `gorm:"type:float"`
	Length      float64 `gorm:"type:float"`
	Width       float64 `gorm:"type:float"`
	Height      float64 `gorm:"type:float"`
	Year        int     `gorm:"type:integer"`
	Status      string  `gorm:"type:varchar(20)"`
	// Связь многие-ко-многим через таблицу LogisticTruck
	Logistics []Logistic `gorm:"many2many:logistic_trucks"`
}
