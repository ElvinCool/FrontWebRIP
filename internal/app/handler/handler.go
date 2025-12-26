package handler

import (
	"RIP/internal/app/auth"
	"RIP/internal/app/repository"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type Handler struct {
	Repository *repository.Repository
	Session    *auth.SessionStore // Оставляем для обратной совместимости, но не используем
	JWT        *auth.JWTManager
}

func NewHandler(r *repository.Repository) *Handler {
	return &Handler{
		Repository: r,
	}
}

// RegisterHandler — регистрирует все маршруты приложения
func (h *Handler) RegisterHandler(router *gin.Engine) {
	// Корневой маршрут - информация об API
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "RIP API Server",
			"version": "1.0",
			"endpoints": gin.H{
				"api": "/api",
				"swagger": "/swagger",
				"trucks": "/trucks",
			},
		})
	})

	// Swagger served from /swagger (index.html + doc.json)
	// --- HTML-маршруты (интерфейс сайта) ---
	router.GET("/trucks", h.GetTrucks)
	router.GET("/truck/:id", h.GetTruck)
	router.GET("/logistic/:id", h.GetLogistic)
	router.POST("/truck/:id/add", h.AddTruckToLogistic)
	router.POST("/logistic/:id/delete", h.DeleteLogistic)

	// --- REST API ---
	api := router.Group("/api")
	api.Use(h.AuthOptional())

	// Public read-only
	api.GET("/trucks", h.GetTrucksAPI)
	api.GET("/truck/:id", h.GetTruckAPI)

	// Users
	api.POST("/users/register", h.RegisterUser)
	api.POST("/users/login", h.LoginUser)
	api.POST("/users/logout", h.LogoutUser)
	api.GET("/users/me", h.GetCurrentUser)
	api.PUT("/users/me", h.UpdateCurrentUser)

	// User-protected (auth required)
	user := api.Group("")
	user.Use(h.AuthRequired())
	user.POST("/logistics/draft/add/:id", h.AddTruckToDraftLogisticAPI)
	user.GET("/logistic/draft", h.GetDraftLogistic)
	user.GET("/logistics", h.GetLogistics)
	user.GET("/logistics/:id", h.APIGetLogistic)
	user.PUT("/logistics/:id/save", h.SaveLogistic) // Сохранение заявки пользователем (статус -> "сформирован")

	// Moderator-only
	mod := api.Group("")
	mod.Use(h.AuthRequired(), h.RequireModerator())
	mod.POST("/truck", h.CreateTruckAPI)
	mod.PUT("/truck/:id", h.UpdateTruckAPI)
	mod.DELETE("/truck/:id", h.DeleteTruckAPI)
	mod.POST("/trucks/:id/image", h.UploadTruckImage)
	mod.DELETE("/logistic-truck/:logistic_id/:truck_id", h.DeleteLogisticTruck)
	mod.PUT("/logistic-truck/:logistic_id/:truck_id", h.UpdateLogisticTruck)

	// Endpoint для приема результатов от Django сервиса (без авторизации, но с проверкой токена)
	// Используем более специфичный путь, чтобы избежать конфликта с /logistic-truck/:logistic_id/:truck_id
	api.PUT("/logistic-trucks/:id/price", h.UpdateLogisticTruckPrice)
	mod.PUT("/logistics/:id", h.UpdateLogistic)
	mod.PUT("/logistics/:id/finalize", h.FinalizeLogistic)
	mod.PUT("/logistics/:id/close", h.CloseOrRejectLogistic)
	mod.DELETE("/logistics/:id", h.APIDeleteLogistic)
}

// RegisterStatic — регистрирует HTML-шаблоны и статику
func (h *Handler) RegisterStatic(router *gin.Engine) {
	router.LoadHTMLGlob("templates/*")
	router.Static("/styles", "./resources/styles")
	router.Static("/img", "./resources/img")
	router.Static("/swagger", "./resources/swagger")
}

// errorHandler — централизованная обработка ошибок
func (h *Handler) errorHandler(ctx *gin.Context, errorStatusCode int, err error) {
	logrus.Error(err.Error())
	ctx.JSON(errorStatusCode, gin.H{
		"status":      "error",
		"description": err.Error(),
	})
}
