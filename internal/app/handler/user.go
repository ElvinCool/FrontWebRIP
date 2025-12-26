package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// POST /api/users/register
func (h *Handler) RegisterUser(ctx *gin.Context) {
	var input struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	user, err := h.Repository.CreateUser(input.Login, input.Password)
	if err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	// Создаём черновую заявку для нового пользователя
	if _, err := h.Repository.GetOrCreateDraftLogistic(user.ID); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"id":    user.ID,
		"login": user.Login,
	})
}

// POST /api/users/login
func (h *Handler) LoginUser(ctx *gin.Context) {
	var input struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	user, err := h.Repository.AuthenticateUser(input.Login, input.Password)
	if err != nil {
		h.errorHandler(ctx, http.StatusUnauthorized, err)
		return
	}

	// Генерируем JWT токен
	if h.JWT != nil {
		token, err := h.JWT.GenerateToken(user.ID, user.IsModerator)
		if err != nil {
			h.errorHandler(ctx, http.StatusInternalServerError, err)
			return
		}
		ctx.JSON(http.StatusOK, gin.H{
			"status":      "logged in",
			"user_id":     user.ID,
			"isModerator": user.IsModerator,
			"token":       token,
		})
		return
	}

	// Fallback на сессии (для обратной совместимости)
	if h.Session != nil {
		sid, err := h.Session.NewSession(ctx, user.ID, user.IsModerator)
		if err != nil {
			h.errorHandler(ctx, http.StatusInternalServerError, err)
			return
		}
		ctx.SetCookie("sid", sid, 86400, "/", "", false, true)
	} else {
		// fallback legacy cookie
		ctx.SetCookie("user_id", strconv.Itoa(int(user.ID)), 3600, "/", "", false, true)
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "logged in", "user_id": user.ID, "isModerator": user.IsModerator})
}

// POST /api/users/logout
func (h *Handler) LogoutUser(ctx *gin.Context) {
	// Отзываем JWT токен, если он предоставлен
	if h.JWT != nil {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" {
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			tokenString = strings.TrimSpace(tokenString)
			if tokenString != "" {
				_ = h.JWT.RevokeToken(tokenString) // Игнорируем ошибки при отзыве
			}
		}
	}

	// Очищаем старые сессии для обратной совместимости
	if sid, err := ctx.Cookie("sid"); err == nil && h.Session != nil {
		_ = h.Session.DeleteSession(ctx, sid)
		ctx.SetCookie("sid", "", -1, "/", "", false, true)
	}
	// legacy cleanup
	ctx.SetCookie("user_id", "", -1, "/", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{"status": "logged out"})
}

// GET /api/users/me
func (h *Handler) GetCurrentUser(ctx *gin.Context) {
	// prefer session from middleware; fallback to legacy cookie
	if uid, ok := getUserID(ctx); ok {
		user, err := h.Repository.GetUserByID(uid)
		if err != nil {
			h.errorHandler(ctx, http.StatusNotFound, err)
			return
		}
		ctx.JSON(http.StatusOK, gin.H{
			"id":          user.ID,
			"login":       user.Login,
			"isModerator": user.IsModerator,
		})
		return
	}

	userIDStr, err := ctx.Cookie("user_id")
	if err != nil {
		h.errorHandler(ctx, http.StatusUnauthorized, err)
		return
	}

	id, _ := strconv.Atoi(userIDStr)
	user, err := h.Repository.GetUserByID(uint(id))
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"login":       user.Login,
		"isModerator": user.IsModerator,
	})
}

// PUT /api/users/me
func (h *Handler) UpdateCurrentUser(ctx *gin.Context) {
	// prefer session
	var uid uint
	if id, ok := getUserID(ctx); ok {
		uid = id
	} else {
		userIDStr, err := ctx.Cookie("user_id")
		if err != nil {
			h.errorHandler(ctx, http.StatusUnauthorized, err)
			return
		}
		n, _ := strconv.Atoi(userIDStr)
		uid = uint(n)
	}

	user, err := h.Repository.GetUserByID(uid)
	if err != nil {
		h.errorHandler(ctx, http.StatusNotFound, err)
		return
	}

	var input struct {
		Password *string `json:"password"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		h.errorHandler(ctx, http.StatusBadRequest, err)
		return
	}

	if input.Password != nil {
		hash, _ := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		user.Password = string(hash)
	}

	if err := h.Repository.UpdateUser(user); err != nil {
		h.errorHandler(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "updated"})
}
