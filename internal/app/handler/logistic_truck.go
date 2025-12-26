package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type UpdateLogisticTruckInput struct {
	Count   int     `json:"count"`
	Price   float64 `json:"price"`
	Comment string  `json:"comment"`
}

func (h *Handler) DeleteLogisticTruck(ctx *gin.Context) {
	logisticID, _ := strconv.Atoi(ctx.Param("logistic_id"))
	truckID, _ := strconv.Atoi(ctx.Param("truck_id"))

	if err := h.Repository.DeleteLogisticTruck(uint(logisticID), uint(truckID)); err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *Handler) UpdateLogisticTruck(ctx *gin.Context) {
	logisticID, _ := strconv.Atoi(ctx.Param("logistic_id"))
	truckID, _ := strconv.Atoi(ctx.Param("truck_id"))

	var input UpdateLogisticTruckInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	if err := h.Repository.UpdateLogisticTruck(uint(logisticID), uint(truckID), input.Count, input.Price, input.Comment); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// UpdateLogisticTruckPrice принимает результаты расчета от Django сервиса
// PUT /api/logistic-trucks/:id/price
func (h *Handler) UpdateLogisticTruckPrice(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// Псевдо-авторизация: проверка токена
	var input struct {
		Price float64 `json:"price"`
		Token string  `json:"token"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// Проверка токена (8 байт)
	const expectedToken = "secret123"
	logrus.Infof("Received token for LogisticTruck ID %d: '%s' (expected: '%s')", id, input.Token, expectedToken)
	if input.Token != expectedToken {
		logrus.Warnf("Invalid token for LogisticTruck ID %d: received '%s', expected '%s'", id, input.Token, expectedToken)
		ctx.JSON(http.StatusForbidden, gin.H{"error": "invalid token"})
		return
	}

	// Обновляем цену
	logrus.Infof("Updating price for LogisticTruck ID %d: %.2f", id, input.Price)
	if err := h.Repository.UpdateLogisticTruckPrice(uint(id), input.Price); err != nil {
		// Если запись не найдена - это не критично (возможно, была удалена)
		// Логируем, но возвращаем 404 вместо 500
		if err.Error() == "record not found" {
			logrus.Warnf("LogisticTruck ID %d not found when updating price", id)
			ctx.JSON(http.StatusNotFound, gin.H{
				"error": "LogisticTruck not found",
				"id":    id,
			})
			return
		}
		logrus.Errorf("Failed to update price for LogisticTruck ID %d: %v", id, err)
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	logrus.Infof("Successfully updated price for LogisticTruck ID %d to %.2f", id, input.Price)
	ctx.JSON(http.StatusOK, gin.H{"status": "price_updated", "id": id, "price": input.Price})
}
