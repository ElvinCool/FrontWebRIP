package ds

type User struct {
	ID          uint   `gorm:"primaryKey"`
	Login       string `gorm:"type:varchar(150);unique;not null"`
	Password    string `gorm:"type:varchar(128);not null"`
	IsModerator bool   `gorm:"type:boolean;default:false"`

	// Связи
	CreatedLogistics   []Logistic `gorm:"foreignKey:CreatorID"`
	ModeratedLogistics []Logistic `gorm:"foreignKey:ModeratorID"`
}
