// internal/app/repository/logistic.go
package repository

import (
	"RIP/internal/app/ds"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func (r *Repository) GetLogisticCount(userID uint) int64 {
	var logisticIDs []uint
	var count int64

	// Находим все логистики со статусом "черновик"
	err := r.db.Model(&ds.Logistic{}).
		Where("creator_id = ? AND status = ?", userID, "черновик").
		Pluck("id", &logisticIDs).Error
	if err != nil {
		logrus.Error("Ошибка при поиске логистик:", err)
		return 0
	}

	// Если таких логистик нет — возвращаем 0
	if len(logisticIDs) == 0 {
		return 0
	}

	// Считаем количество записей в LogisticTruck для найденных логистик
	err = r.db.Model(&ds.LogisticTruck{}).
		Where("logistic_id IN ?", logisticIDs).
		Count(&count).Error
	if err != nil {
		logrus.Error("Ошибка при подсчёте LogisticTruck:", err)
		return 0
	}

	return count
}

func (r *Repository) GetDraftLogisticID(userID uint) uint {
	var logistic ds.Logistic

	err := r.db.Model(&ds.Logistic{}).
		Where("creator_id = ? AND status = ?", userID, "черновик").
		First(&logistic).Error
	if err != nil {
		return 0
	}

	return logistic.ID
}

func (r *Repository) GetLogisticByID(id uint) (*ds.Logistic, error) {
	var logistic ds.Logistic
	err := r.db.
		Preload("Creator").
		Preload("Moderator").
		Preload("LogisticTrucks.Truck").
		First(&logistic, id).Error

	if err != nil {
		return nil, err
	}

	return &logistic, nil
}

func (r *Repository) AddTruckToLogistic(logisticID, truckID uint) error {
	var lt ds.LogisticTruck

	// Проверяем, есть ли уже такая запись
	err := r.db.Where("logistic_id = ? AND truck_id = ?", logisticID, truckID).First(&lt).Error
	if err == nil {
		// Уже есть — не добавляем повторно
		return nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// Добавляем новую запись в корзину
	newLT := ds.LogisticTruck{
		LogisticID:     logisticID,
		TruckID:        truckID,
		CountLogistics: 1, // начальное количество
		Price:          0, // можно потом посчитать
	}

	return r.db.Create(&newLT).Error
}

//API!!!

// removed hardcoded creator id; pass user explicitly

// ---- Получение или создание черновика заявки ----
func (r *Repository) GetOrCreateDraftLogistic(userID uint) (*ds.Logistic, error) {
	var logistic ds.Logistic

	// Ищем существующий черновик данного пользователя
	err := r.db.Where("status = ? AND creator_id = ?", "черновик", userID).First(&logistic).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		newLog := ds.Logistic{
			Status:     "черновик",
			CreatorID:  userID,
			DateCreate: time.Now(),
			DateUpdate: time.Now(),
		}

		if err := r.db.Create(&newLog).Error; err != nil {
			return nil, err
		}
		return &newLog, nil
	}

	if err != nil {
		return nil, err
	}

	return &logistic, nil
}

// ---- Добавление грузовика в черновик ----
func (r *Repository) AddTruckToDraftLogistic(userID uint, truckID uint) error {
	logistic, err := r.GetOrCreateDraftLogistic(userID)
	if err != nil {
		return err
	}

	// Проверяем, есть ли уже связь
	var lt ds.LogisticTruck
	err = r.db.Where("logistic_id = ? AND truck_id = ?", logistic.ID, truckID).First(&lt).Error
	if err == nil {
		// Уже есть — не добавляем повторно
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	newLT := ds.LogisticTruck{
		LogisticID:     logistic.ID,
		TruckID:        truckID,
		CountLogistics: 1,
		Price:          0,
	}

	return r.db.Create(&newLT).Error
}

// Получить корзину текущего пользователя (черновик)
func (r *Repository) GetDraftLogistic(userID uint) (ds.Logistic, int, error) {
	var logistic ds.Logistic
	err := r.db.Preload("LogisticTrucks").Where("creator_id = ? AND status = ?", userID, "черновик").First(&logistic).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ds.Logistic{}, 0, nil
		}
		return ds.Logistic{}, 0, err
	}

	count := len(logistic.LogisticTrucks)
	return logistic, count, nil
}

// Список логистик с фильтрацией по статусу и дате
func (r *Repository) GetLogistics(userID uint, isModerator bool, filterStatus string, fromDate, toDate time.Time) ([]ds.Logistic, error) {
	var logistics []ds.Logistic

	q := r.db.Preload("Creator").Preload("Moderator").Preload("LogisticTrucks.Truck").
		Where("status != ?", "deleted")

	if !isModerator && userID != 0 {
		q = q.Where("creator_id = ?", userID)
	}

	if filterStatus != "" {
		q = q.Where("status = ?", filterStatus)
	}

	if !fromDate.IsZero() && !toDate.IsZero() {
		q = q.Where("date_create BETWEEN ? AND ?", fromDate, toDate)
	}

	if err := q.Find(&logistics).Error; err != nil {
		return nil, err
	}

	// Вычисляемое поле для каждой заявки
	for i := range logistics {
		count := 0
		for _, lt := range logistics[i].LogisticTrucks {
			if lt.Price != 0 { // условие для "рассчитанного" поля
				count++
			}
		}
		_ = count
	}

	return logistics, nil
}

// Получить одну заявку
func (r *Repository) APIGetLogisticByID(id uint) (ds.Logistic, error) {
	var logistic ds.Logistic
	if err := r.db.Preload("LogisticTrucks.Truck").Preload("Creator").Preload("Moderator").
		First(&logistic, id).Error; err != nil {
		return ds.Logistic{}, err
	}
	return logistic, nil
}

// Обновление заявки по теме (PUT)
func (r *Repository) UpdateLogistic(id uint, status, comment string) error {
	var logistic ds.Logistic
	if err := r.db.First(&logistic, id).Error; err != nil {
		return err
	}

	if status != "" {
		logistic.Status = status
	}
	// Можно добавить другие поля заявки

	return r.db.Save(&logistic).Error
}

// Обновление данных LogisticTruck (количество, цена, комментарий)
func (r *Repository) UpdateLogisticTruckData(logisticID, truckID uint, count *int, distance *float64, price *float64, comment *string) error {
	updateData := make(map[string]interface{})
	
	if count != nil {
		updateData["count_logistics"] = *count // Количество машин
	}
	if distance != nil {
		updateData["distance"] = *distance // Расстояние в километрах
	}
	if price != nil {
		updateData["price"] = *price
	}
	if comment != nil {
		updateData["comment"] = *comment
	}

	if len(updateData) == 0 {
		return nil // Нет данных для обновления
	}

	// Проверяем, существует ли запись
	var lt ds.LogisticTruck
	if err := r.db.Where("logistic_id = ? AND truck_id = ?", logisticID, truckID).First(&lt).Error; err != nil {
		return err
	}

	return r.db.Model(&ds.LogisticTruck{}).
		Where("logistic_id = ? AND truck_id = ?", logisticID, truckID).
		Updates(updateData).Error
}

// Сформировать заявку создателем (устанавливается дата)
func (r *Repository) FinalizeLogistic(id uint) error {
	var logistic ds.Logistic
	if err := r.db.Preload("LogisticTrucks").First(&logistic, id).Error; err != nil {
		return err
	}

	logistic.Status = "сформирован"
	logistic.DateUpdate = time.Now()

	// Проверка обязательных полей, например:
	if len(logistic.LogisticTrucks) == 0 {
		return errors.New("заявка пустая, нельзя сформировать")
	}

	return r.db.Save(&logistic).Error
}

// Завершение/отклонение модератором
// Расчет цены теперь выполняется асинхронно через Django сервис
func (r *Repository) CloseOrRejectLogistic(id uint, moderatorID uint, status string) error {
	var logistic ds.Logistic
	// Загружаем заявку с LogisticTrucks для последующего вызова сервиса расчета
	if err := r.db.Preload("LogisticTrucks").First(&logistic, id).Error; err != nil {
		return err
	}

	logistic.ModeratorID = sql.NullInt64{Int64: int64(moderatorID), Valid: true}
	logistic.DateFinish = sql.NullTime{Time: time.Now(), Valid: true}
	logistic.Status = status
	logistic.DateUpdate = time.Now()
	
	// Сохраняем заявку (расчет цены будет выполнен асинхронно через Django сервис)
	return r.db.Save(&logistic).Error
}

// Удаление заявки (устанавливаем статус deleted)
func (r *Repository) DeleteLogistic(id uint) error {
	var logistic ds.Logistic

	// Загружаем заявку с зависимостями (чтобы можно было проверить)
	if err := r.db.Preload("LogisticTrucks").First(&logistic, id).Error; err != nil {
		return err
	}

	// Проверка статуса
	if logistic.Status == "удалена" {
		return fmt.Errorf("заявка уже удалена")
	}

	// Проставляем дату завершения и статус
	now := time.Now()
	logistic.Status = "удалена"
	logistic.DateFinish = sql.NullTime{Time: now, Valid: true}

	// Сохраняем изменения
	if err := r.db.Save(&logistic).Error; err != nil {
		return err
	}

	return nil
}
