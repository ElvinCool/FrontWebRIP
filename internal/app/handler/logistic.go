package handler

import (
	"RIP/internal/app/ds"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// DTO структуры для API ответов
type LogisticResponse struct {
	ID              uint                    `json:"id"`
	Status          string                  `json:"status"`
	DateCreate      string                  `json:"date_create,omitempty"`      // Для обратной совместимости (только для детального просмотра)
	DateUpdate      string                  `json:"date_update,omitempty"`      // Для обратной совместимости (только для детального просмотра)
	DateFinish      *string                 `json:"date_finish,omitempty"`      // Для обратной совместимости (только для детального просмотра)
	Creator         *UserResponse           `json:"creator,omitempty"`          // Для обратной совместимости (только для детального просмотра)
	Moderator       *UserResponse           `json:"moderator,omitempty"`        // Для обратной совместимости (только для детального просмотра)
	LogisticTrucks  []LogisticTruckResponse `json:"logistic_trucks,omitempty"`  // Только для детального просмотра
	CalculatedCount *int                    `json:"calculated_count,omitempty"` // Вычисляемое поле: количество услуг с рассчитанным полем (Price != 0)
	TrucksCount     *int                    `json:"trucks_count,omitempty"`     // Количество грузовиков в заявке (для списка)

	// Новый формат (как в примере)
	CreatedByID *uint   `json:"created_by_id,omitempty"`
	CreatedAt   *string `json:"created_at,omitempty"`
	FormedAt    *string `json:"formed_at,omitempty"` // Дата формирования (когда статус стал "сформирован")
	ClosedByID  *uint   `json:"closed_by_id,omitempty"`
	ClosedAt    *string `json:"closed_at,omitempty"`
	DeletedAt   *string `json:"deleted_at,omitempty"`
	PeriodDays  *int    `json:"period_days,omitempty"` // Период в днях (разница между created_at и closed_at)

	// Агрегированные данные из logistic_trucks
	TotalPrice         *float64 `json:"total_price,omitempty"`          // Общая сумма цен всех грузовиков
	TotalCountMachines *int     `json:"total_count_machines,omitempty"` // Общее количество машин (sum of count_logistics)
}

type UserResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type LogisticTruckResponse struct {
	ID             uint          `json:"id"`
	TruckID        uint          `json:"truck_id"`
	CountLogistics int           `json:"count_logistics"` // Количество машин
	Distance       float64       `json:"distance"`        // Расстояние в километрах
	Price          float64       `json:"price"`
	Comment        string        `json:"comment"`
	Truck          TruckResponse `json:"truck"`
}

type TruckResponse struct {
	ID          uint    `json:"id"`
	Title       string  `json:"title"`
	Preview     string  `json:"preview"`
	ImgURL      string  `json:"img_url"`
	Description string  `json:"description"`
	Weight      float64 `json:"weight"`
	Price       float64 `json:"price"`
	Length      float64 `json:"length"`
	Width       float64 `json:"width"`
	Height      float64 `json:"height"`
	Year        int     `json:"year"`
	Status      string  `json:"status"`
}

// Преобразование Logistic в LogisticResponse
func toLogisticResponse(logistic ds.Logistic) LogisticResponse {
	trucksCount := len(logistic.LogisticTrucks)

	creator := UserResponse{
		ID:   logistic.Creator.ID,
		Name: logistic.Creator.Login,
	}

	response := LogisticResponse{
		ID:             logistic.ID,
		Status:         logistic.Status,
		DateCreate:     logistic.DateCreate.Format("2006-01-02 15:04:05"),
		DateUpdate:     logistic.DateUpdate.Format("2006-01-02 15:04:05"),
		Creator:        &creator,
		LogisticTrucks: make([]LogisticTruckResponse, 0, len(logistic.LogisticTrucks)),
		TrucksCount:    &trucksCount, // Общее количество грузовиков (м-м связей) в заявке
	}

	// Дата завершения
	if logistic.DateFinish.Valid {
		dateFinish := logistic.DateFinish.Time.Format("2006-01-02 15:04:05")
		response.DateFinish = &dateFinish
	}

	// Модератор
	if logistic.ModeratorID.Valid && logistic.Moderator.ID != 0 {
		moderator := UserResponse{
			ID:   logistic.Moderator.ID,
			Name: logistic.Moderator.Login,
		}
		response.Moderator = &moderator
	}

	// LogisticTrucks
	for _, lt := range logistic.LogisticTrucks {
		truckResponse := TruckResponse{
			ID:          lt.Truck.ID,
			Title:       lt.Truck.Title,
			Preview:     lt.Truck.Preview,
			ImgURL:      lt.Truck.ImgURL,
			Description: lt.Truck.Description,
			Weight:      lt.Truck.Weight,
			Price:       lt.Truck.Price,
			Length:      lt.Truck.Length,
			Width:       lt.Truck.Width,
			Height:      lt.Truck.Height,
			Year:        lt.Truck.Year,
			Status:      lt.Truck.Status,
		}

		ltResponse := LogisticTruckResponse{
			ID:             lt.ID,
			TruckID:        lt.TruckID,
			CountLogistics: lt.CountLogistics,
			Distance:       lt.Distance,
			Price:          lt.Price,
			Comment:        lt.Comment,
			Truck:          truckResponse,
		}

		response.LogisticTrucks = append(response.LogisticTrucks, ltResponse)
	}

	// Вычисляемое поле: количество услуг с рассчитанным полем (Price != 0)
	calculatedCount := 0
	for _, lt := range logistic.LogisticTrucks {
		if lt.Price != 0 {
			calculatedCount++
		}
	}
	response.CalculatedCount = &calculatedCount

	return response
}

// Преобразование Logistic в LogisticResponse (упрощенная версия для списка, без грузовиков)
func toLogisticResponseList(logistic ds.Logistic) LogisticResponse {
	// Вычисляемое поле: количество услуг с рассчитанным полем (Price != 0)
	calculatedCount := 0
	trucksCount := len(logistic.LogisticTrucks)
	var totalPrice float64
	var totalCountMachines int

	for _, lt := range logistic.LogisticTrucks {
		if lt.Price != 0 {
			calculatedCount++
		}
		// Суммируем цены
		totalPrice += lt.Price
		// Суммируем количество машин
		totalCountMachines += lt.CountLogistics
	}

	// Форматируем даты в ISO8601
	createdAt := logistic.DateCreate.Format(time.RFC3339Nano)

	// Определяем formed_at (дата формирования - когда статус стал "сформирован")
	var formedAt *string
	if logistic.Status == "сформирован" || logistic.Status == "завершен" || logistic.Status == "отклонен" {
		// Используем DateUpdate как дату формирования, если статус не "черновик"
		if logistic.Status != "черновик" {
			formedAtStr := logistic.DateUpdate.Format(time.RFC3339Nano)
			formedAt = &formedAtStr
		}
	}

	// Определяем closed_at (дата закрытия)
	var closedAt *string
	var closedByID *uint
	if logistic.DateFinish.Valid {
		closedAtStr := logistic.DateFinish.Time.Format(time.RFC3339Nano)
		closedAt = &closedAtStr
	}
	if logistic.ModeratorID.Valid {
		modID := uint(logistic.ModeratorID.Int64)
		closedByID = &modID
	}

	// Вычисляем period_days (разница между created_at и closed_at в днях)
	var periodDays *int
	if closedAt != nil {
		days := int(logistic.DateFinish.Time.Sub(logistic.DateCreate).Hours() / 24)
		if days > 0 {
			periodDays = &days
		}
	}

	// Создаем объект Creator для списка
	creator := UserResponse{
		ID:   logistic.Creator.ID,
		Name: logistic.Creator.Login,
	}

	response := LogisticResponse{
		ID:              logistic.ID,
		Status:          logistic.Status,
		CalculatedCount: &calculatedCount,
		TrucksCount:     &trucksCount,

		// Для обратной совместимости
		Creator: &creator,

		// Новый формат
		CreatedByID: &logistic.CreatorID,
		CreatedAt:   &createdAt,
		FormedAt:    formedAt,
		ClosedByID:  closedByID,
		ClosedAt:    closedAt,
		DeletedAt:   nil, // Пока нет мягкого удаления
		PeriodDays:  periodDays,

		// Агрегированные данные из logistic_trucks
		TotalPrice:         &totalPrice,
		TotalCountMachines: &totalCountMachines,
	}

	return response
}

func (h *Handler) GetLogistic(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	logistic, err := h.Repository.GetLogisticByID(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.HTML(http.StatusOK, "logistics.html", gin.H{
		"logistic": logistic,
	})
}

func (h *Handler) DeleteLogistic(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		logrus.Error(err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.Repository.MarkLogisticDeleted(uint(id))
	if err != nil {
		logrus.Error(err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "cannot delete logistic"})
		return
	}

	// После "удаления" можно перенаправить на список заявок
	ctx.Redirect(http.StatusSeeOther, "/logistics")
}

func (h *Handler) AddTruckToLogistic(ctx *gin.Context) {
	truckIDStr := ctx.Param("id")
	truckID, err := strconv.Atoi(truckIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid truck id"})
		return
	}

	// Берём текущую черновую логистику (корзину) для пользователя
	uid, _ := getUserID(ctx)
	logisticID := h.Repository.GetDraftLogisticID(uid)
	if logisticID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "no draft logistic found"})
		return
	}

	err = h.Repository.AddTruckToLogistic(logisticID, uint(truckID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// После добавления перенаправляем обратно на страницу грузовиков
	ctx.Redirect(http.StatusSeeOther, "/trucks")
}

//API

// POST /api/logistics/draft/add/:id
func (h *Handler) AddTruckToDraftLogisticAPI(ctx *gin.Context) {
	idStr := ctx.Param("id")
	truckID, err := strconv.Atoi(idStr)
	if err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	uid2, ok := getUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	err = h.Repository.AddTruckToDraftLogistic(uid2, uint(truckID))
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status": "truck added to draft logistic",
		"truck":  truckID,
	})
}

func (h *Handler) GetDraftLogistic(ctx *gin.Context) {
	userID, ok := getUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	logistic, count, err := h.Repository.GetDraftLogistic(userID)
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"id":            logistic.ID,
		"service_count": count,
	})
}

func (h *Handler) GetLogistics(ctx *gin.Context) {
	status := ctx.Query("status")
	from := ctx.Query("from")
	to := ctx.Query("to")

	var fromDate, toDate time.Time
	if from != "" && to != "" {
		fromDate, _ = time.Parse("2006-01-02", from)
		toDate, _ = time.Parse("2006-01-02", to)
	}

	uid, ok := getUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	logistics, err := h.Repository.GetLogistics(uid, isModerator(ctx), status, fromDate, toDate)
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	// Для модератора показываем все статусы, для обычного пользователя - только черновик, завершен, отклонен
	allowedStatuses := map[string]bool{
		"черновик":    true,
		"сформирован": true, // Добавляем для модератора
		"завершен":    true,
		"отклонен":    true,
	}

	// Преобразуем в DTO и фильтруем по статусам (упрощенная версия без грузовиков)
	responses := make([]LogisticResponse, 0)
	for _, logistic := range logistics {
		// Если модератор - показываем все статусы, иначе только разрешенные
		if isModerator(ctx) || allowedStatuses[logistic.Status] {
			responses = append(responses, toLogisticResponseList(logistic))
		}
	}

	ctx.JSON(http.StatusOK, responses)
}

func (h *Handler) APIGetLogistic(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	logistic, err := h.Repository.GetLogisticByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	response := toLogisticResponse(*logistic)
	ctx.JSON(http.StatusOK, response)
}

func (h *Handler) UpdateLogistic(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var input struct {
		Status string `json:"status"`
		// Данные для обновления м-м таблицы (LogisticTrucks)
		LogisticTrucks []struct {
			TruckID        uint     `json:"truck_id"`
			CountLogistics *int     `json:"count_logistics,omitempty"` // Количество машин
			Distance       *float64 `json:"distance,omitempty"`        // Расстояние в километрах
			Price          *float64 `json:"price,omitempty"`           // Цена за км
			Comment        *string  `json:"comment,omitempty"`         // Комментарий
		} `json:"logistic_trucks,omitempty"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// Обновляем статус заявки, если указан
	if input.Status != "" {
		if err := h.Repository.UpdateLogistic(uint(id), input.Status, ""); err != nil {
			h.errorHandler(ctx, http.StatusInternalServerError, err)
			return
		}
	}

	// Обновляем данные м-м таблицы (LogisticTrucks)
	if len(input.LogisticTrucks) > 0 {
		for _, ltInput := range input.LogisticTrucks {
			if err := h.Repository.UpdateLogisticTruckData(
				uint(id),
				ltInput.TruckID,
				ltInput.CountLogistics, // Количество машин
				ltInput.Distance,       // Расстояние в километрах
				ltInput.Price,
				ltInput.Comment,
			); err != nil {
				h.errorHandler(ctx, http.StatusInternalServerError, err)
				return
			}
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// Сохранение заявки пользователем (статус -> "сформирован")
func (h *Handler) SaveLogistic(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	userID, ok := getUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Проверяем, что заявка принадлежит пользователю
	logistic, err := h.Repository.GetLogisticByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	if logistic.CreatorID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden: not your logistic"})
		return
	}

	// Проверяем, что заявка в статусе "черновик"
	if logistic.Status != "черновик" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "can only save draft logistics"})
		return
	}

	// Проверяем, есть ли данные для обновления LogisticTrucks (distance для километров)
	var input struct {
		LogisticTrucks []struct {
			TruckID        uint     `json:"truck_id"`
			CountLogistics *int     `json:"count_logistics,omitempty"` // Количество машин
			Distance       *float64 `json:"distance,omitempty"`        // Расстояние в километрах
		} `json:"logistic_trucks,omitempty"`
	}

	// Читаем тело запроса для логирования
	bodyBytes, _ := ctx.GetRawData()
	logrus.Infof("SaveLogistic request body for logistic_id=%d: %s", id, string(bodyBytes))

	// Восстанавливаем тело для ShouldBindJSON
	ctx.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Пытаемся прочитать данные, но не требуем их обязательного наличия
	if err := ctx.ShouldBindJSON(&input); err != nil {
		logrus.Warnf("Failed to bind JSON in SaveLogistic for logistic_id=%d: %v", id, err)
	} else {
		logrus.Infof("Parsed LogisticTrucks in SaveLogistic for logistic_id=%d: count=%d", id, len(input.LogisticTrucks))
		if len(input.LogisticTrucks) > 0 {
			// Обновляем Distance (километры) и CountLogistics (количество машин) для всех указанных грузовиков
			for _, ltInput := range input.LogisticTrucks {
				if ltInput.Distance != nil || ltInput.CountLogistics != nil {
					logrus.Infof("Updating LogisticTruck (logistic_id=%d, truck_id=%d): distance=%v, count_logistics=%v",
						id, ltInput.TruckID, ltInput.Distance, ltInput.CountLogistics)
					if err := h.Repository.UpdateLogisticTruckData(
						uint(id),
						ltInput.TruckID,
						ltInput.CountLogistics, // Количество машин
						ltInput.Distance,       // Расстояние в километрах
						nil,                    // price не обновляем
						nil,                    // comment не обновляем
					); err != nil {
						logrus.Warnf("Failed to update LogisticTruck (logistic_id=%d, truck_id=%d): %v",
							id, ltInput.TruckID, err)
						// Продолжаем, даже если не удалось обновить
					} else {
						logrus.Infof("Successfully updated LogisticTruck (logistic_id=%d, truck_id=%d): distance=%v, count_logistics=%v",
							id, ltInput.TruckID, ltInput.Distance, ltInput.CountLogistics)
					}
				}
			}
		}
	}

	// Используем FinalizeLogistic из repository для изменения статуса на "сформирован"
	if err := h.Repository.FinalizeLogistic(uint(id)); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "сформирован"})
}

// callAsyncPriceService вызывает Django сервис для асинхронного расчета цены LogisticTruck
func (h *Handler) callAsyncPriceService(lt *ds.LogisticTruck) error {
	// Проверка валидности ID
	if lt.ID == 0 {
		return fmt.Errorf("invalid LogisticTruck ID: 0")
	}

	// Если грузовик не загружен, загружаем его для получения цены
	logrus.Infof("Checking truck for LogisticTruck ID %d: TruckID=%d, Truck.ID=%d, Truck.Price=%f",
		lt.ID, lt.TruckID, lt.Truck.ID, lt.Truck.Price)

	if lt.Truck.ID == 0 {
		logrus.Infof("Truck not loaded, loading truck ID %d for LogisticTruck ID %d", lt.TruckID, lt.ID)
		truck, err := h.Repository.GetTruckByID(lt.TruckID)
		if err != nil {
			logrus.Errorf("Failed to load truck ID %d for LogisticTruck ID %d: %v", lt.TruckID, lt.ID, err)
			return fmt.Errorf("failed to load truck: %w", err)
		}
		lt.Truck = *truck
		logrus.Infof("Loaded truck ID %d: Price=%f", truck.ID, truck.Price)
	}

	// Проверка наличия цены грузовика
	logrus.Infof("Final check: LogisticTruck ID %d, Truck ID %d, Truck Price=%f",
		lt.ID, lt.Truck.ID, lt.Truck.Price)

	// Используем цену грузовика, если она есть, иначе используем значение по умолчанию
	pricePerKm := lt.Truck.Price
	if pricePerKm <= 0 {
		logrus.Warnf("Truck price is zero or negative for LogisticTruck ID %d: Truck ID %d, Price=%f. Using default price 100.0",
			lt.ID, lt.Truck.ID, lt.Truck.Price)
		pricePerKm = 100.0 // Значение по умолчанию, если цена не указана
	}

	// URL Django сервиса
	asyncServiceURL := "http://localhost:8001/"

	// Подготавливаем данные для отправки: ID, расстояние в километрах и цена грузовика за км
	// Используем Distance для километров, а не CountLogistics (которое для количества машин)
	distance := lt.Distance
	if distance <= 0 {
		logrus.Warnf("Distance is zero or negative for LogisticTruck ID %d: Distance=%f. Using default distance 250.0",
			lt.ID, distance)
		distance = 250.0 // Значение по умолчанию, если расстояние не указано
	}

	payload := map[string]interface{}{
		"pk":              lt.ID,
		"count_logistics": int(distance), // Расстояние в километрах для расчета (используем Distance, не CountLogistics)
		"price_per_km":    pricePerKm,    // Цена грузовика за километр (или значение по умолчанию)
	}

	logrus.Infof("Prepared payload for LogisticTruck ID %d: pk=%d, count_logistics=%d, price_per_km=%f",
		lt.ID, payload["pk"], payload["count_logistics"], payload["price_per_km"])

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	logrus.Infof("Sending async price calculation request for LogisticTruck ID %d: %s", lt.ID, string(jsonData))

	// Отправляем POST запрос
	resp, err := http.Post(asyncServiceURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		logrus.Errorf("Failed to send request to async service for LogisticTruck ID %d: %v", lt.ID, err)
		return fmt.Errorf("failed to send request to async service: %w", err)
	}
	defer resp.Body.Close()

	// Читаем тело ответа для логирования
	bodyBytes, _ := io.ReadAll(resp.Body)
	bodyStr := string(bodyBytes)

	if resp.StatusCode != http.StatusOK {
		logrus.Warnf("Async service returned status %d for LogisticTruck ID %d. Response: %s", resp.StatusCode, lt.ID, bodyStr)
		return fmt.Errorf("async service returned status %d: %s", resp.StatusCode, bodyStr)
	}

	logrus.Infof("Async service accepted request for LogisticTruck ID %d. Response: %s", lt.ID, bodyStr)

	return nil
}

func (h *Handler) FinalizeLogistic(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	// Only moderator can finalize (complete)
	if !isModerator(ctx) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// Загружаем заявку с LogisticTrucks перед завершением
	logistic, err := h.Repository.GetLogisticByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	// Завершаем заявку
	if err := h.Repository.CloseOrRejectLogistic(uint(id), getModeratorID(ctx), "завершен"); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// Вызываем Django сервис для асинхронного расчета цены каждого LogisticTruck
	for i := range logistic.LogisticTrucks {
		lt := &logistic.LogisticTrucks[i]
		if lt.ID == 0 {
			logrus.Warnf("LogisticTruck has invalid ID (0), skipping async price calculation")
			continue
		}
		if err := h.callAsyncPriceService(lt); err != nil {
			logrus.Errorf("Failed to call async price service for LogisticTruck ID %d: %v", lt.ID, err)
			// Продолжаем обработку других записей даже при ошибке
		} else {
			logrus.Infof("Async price calculation started for LogisticTruck ID %d (km: %d)", lt.ID, lt.CountLogistics)
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "завершен"})
}

func (h *Handler) CloseOrRejectLogistic(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	if !isModerator(ctx) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	moderatorID := getModeratorID(ctx)
	status := ctx.Query("status") // входные значения: "rejected" или "completed"
	if status == "" {             // по умолчанию считаем как завершение
		status = "completed"
	}
	// Нормализуем в русские статусы БД
	switch status {
	case "completed", "close", "done":
		status = "завершен"
	case "rejected", "reject":
		status = "отклонен"
	}

	// Загружаем заявку с LogisticTrucks перед завершением
	logistic, err := h.Repository.GetLogisticByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	// Завершаем заявку
	if err := h.Repository.CloseOrRejectLogistic(uint(id), moderatorID, status); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	// Если статус "завершен", вызываем Django сервис для расчета цены
	if status == "завершен" {
		for i := range logistic.LogisticTrucks {
			lt := &logistic.LogisticTrucks[i]
			if lt.ID == 0 {
				logrus.Warnf("LogisticTruck has invalid ID (0), skipping async price calculation")
				continue
			}
			if err := h.callAsyncPriceService(lt); err != nil {
				logrus.Errorf("Failed to call async price service for LogisticTruck ID %d: %v", lt.ID, err)
				// Продолжаем обработку других записей даже при ошибке
			} else {
				logrus.Infof("Async price calculation started for LogisticTruck ID %d (km: %d)", lt.ID, lt.CountLogistics)
			}
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"status": status})
}

func (h *Handler) APIDeleteLogistic(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.Repository.DeleteLogistic(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
