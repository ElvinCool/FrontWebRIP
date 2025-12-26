package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) UploadTruckImage(ctx *gin.Context) {
	truckIDStr := ctx.Param("id")
	truckID, err := strconv.ParseUint(truckIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid truck id"})
		return
	}

	file, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "file not provided"})
		return
	}

	url, err := h.Repository.UploadTruckImage(uint(truckID), file)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status": "uploaded",
		"url":    url,
	})
}

func (h *Handler) DeleteTruckImage(ctx *gin.Context) {
	truckIDStr := ctx.Param("id")
	truckID, err := strconv.ParseUint(truckIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid truck id"})
		return
	}

	err = h.Repository.DeleteTruckImage(uint(truckID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status": "deleted",
	})
}
