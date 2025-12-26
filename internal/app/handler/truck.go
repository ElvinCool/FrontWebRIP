package handler

import (
	"RIP/internal/app/ds"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func (h *Handler) GetTrucks(ctx *gin.Context) {
	var trucks []ds.Truck
	var err error

	searchQuery := ctx.Query("query")

	if searchQuery == "" {
		trucks, err = h.Repository.GetTrucks()
	} else {
		trucks, err = h.Repository.GetTrucksByTitle(searchQuery)
	}

	if err != nil {
		logrus.Error(err)
	}

	uid, _ := getUserID(ctx)
	ctx.HTML(http.StatusOK, "trucks.html", gin.H{
		"trucks":         trucks,
		"query":          searchQuery,
		"logistic_count": h.Repository.GetLogisticCount(uid),
		"draft_id":       h.Repository.GetDraftLogisticID(uid),
	})
}

func (h *Handler) GetTruck(ctx *gin.Context) {
	strId := ctx.Param("id")
	id, err := strconv.Atoi(strId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		logrus.Error(err)
		return
	}

	truck, err := h.Repository.GetTruck(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		logrus.Error(err)
		return
	}

	uid2, _ := getUserID(ctx)
	ctx.HTML(http.StatusOK, "truck_details.html", gin.H{
		"truck":          truck,
		"logistic_count": h.Repository.GetLogisticCount(uid2),
		"draft_id":       h.Repository.GetDraftLogisticID(uid2),
	})
}

// GET /api/trucks?title=...&status=...
func (h *Handler) GetTrucksAPI(ctx *gin.Context) {
	title := ctx.Query("title")
	status := ctx.Query("status")

	trucks, err := h.Repository.GetTrucksFiltered(title, status)
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": trucks})
}

// GET /api/truck/:id
func (h *Handler) GetTruckAPI(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	truck, err := h.Repository.GetTruckByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	ctx.JSON(http.StatusOK, truck)
}

// POST /api/truck
func (h *Handler) CreateTruckAPI(ctx *gin.Context) {
	var truck ds.Truck
	if err := ctx.ShouldBindJSON(&truck); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// системные поля не принимаем от клиента
	truck.ID = 0
	truck.Status = "active"

	if err := h.Repository.CreateTruck(&truck); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Truck created", "truck": truck})
}

// PUT /api/truck/:id
func (h *Handler) UpdateTruckAPI(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	var payload map[string]interface{}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	// Убираем системные поля
	delete(payload, "id")
	delete(payload, "status")
	delete(payload, "created_at")
	delete(payload, "updated_at")

	if err := h.Repository.UpdateTruck(uint(id), payload); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Truck updated"})
}

// DELETE /api/truck/:id
func (h *Handler) DeleteTruckAPI(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	err = h.Repository.DeleteTruckByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status": "deleted",
		"id":     id,
	})
}
