package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	ctxUserIDKey      = "current_user_id"
	ctxIsModeratorKey = "current_user_is_moderator"
)

// AuthOptional extracts user from JWT token or session cookie if present
func (h *Handler) AuthOptional() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Сначала пробуем JWT токен из заголовка Authorization
		if h.JWT != nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				// Формат: "Bearer <token>" или просто "<token>"
				tokenString := strings.TrimPrefix(authHeader, "Bearer ")
				tokenString = strings.TrimSpace(tokenString)
				
				if tokenString != "" {
					claims, err := h.JWT.ValidateToken(tokenString)
					if err == nil && claims != nil {
						c.Set(ctxUserIDKey, claims.UserID)
						c.Set(ctxIsModeratorKey, claims.IsModerator)
						c.Next()
						return
					}
				}
			}
		}

		// Fallback на сессии (для обратной совместимости)
		sid, err := c.Cookie("sid")
		if err == nil && sid != "" && h.Session != nil {
			uid, isMod, ok, err := h.Session.GetSession(context.Background(), sid)
			if err == nil && ok {
				c.Set(ctxUserIDKey, uid)
				c.Set(ctxIsModeratorKey, isMod)
			}
		}
		c.Next()
	}
}

// AuthRequired ensures user is authenticated
func (h *Handler) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		if v, exists := c.Get(ctxUserIDKey); !exists || v == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

// RequireModerator ensures current user is moderator
func (h *Handler) RequireModerator() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !isModerator(c) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func getUserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(ctxUserIDKey)
	if !ok {
		// fallback to legacy cookie user_id if exists
		if s, err := c.Cookie("user_id"); err == nil {
			if id, err2 := strconv.Atoi(s); err2 == nil {
				return uint(id), true
			}
		}
		return 0, false
	}
	if id, ok := v.(uint); ok {
		return id, true
	}
	return 0, false
}

func isModerator(c *gin.Context) bool {
	v, ok := c.Get(ctxIsModeratorKey)
	if !ok {
		return false
	}
	b, _ := v.(bool)
	return b
}

func getModeratorID(c *gin.Context) uint {
	if !isModerator(c) {
		return 0
	}
	id, ok := getUserID(c)
	if !ok {
		return 0
	}
	return id
}
