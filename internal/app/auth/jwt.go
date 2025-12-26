package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token expired")
	ErrTokenRevoked = errors.New("token revoked")
)

// JWTClaims содержит данные пользователя в токене
type JWTClaims struct {
	UserID      uint `json:"user_id"`
	IsModerator bool `json:"is_moderator"`
	jwt.RegisteredClaims
}

// JWTManager управляет JWT токенами с хранением в Redis
type JWTManager struct {
	secretKey     []byte
	tokenDuration time.Duration
	rdb           *redis.Client
	ctx           context.Context
}

// NewJWTManager создает новый менеджер JWT токенов с Redis
func NewJWTManager(secretKey string, tokenDuration time.Duration, rdb *redis.Client) *JWTManager {
	return &JWTManager{
		secretKey:     []byte(secretKey),
		tokenDuration: tokenDuration,
		rdb:           rdb,
		ctx:           context.Background(),
	}
}

// tokenHash создает хеш токена для использования в качестве ключа Redis
func (m *JWTManager) tokenHash(tokenString string) string {
	hash := sha256.Sum256([]byte(tokenString))
	return hex.EncodeToString(hash[:])
}

// GenerateToken создает новый JWT токен для пользователя и сохраняет его в Redis
func (m *JWTManager) GenerateToken(userID uint, isModerator bool) (string, error) {
	claims := JWTClaims{
		UserID:      userID,
		IsModerator: isModerator,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.tokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(m.secretKey)
	if err != nil {
		return "", err
	}

	// Сохраняем токен в Redis
	if m.rdb != nil {
		tokenHash := m.tokenHash(tokenString)
		key := "jwt:" + tokenHash
		fields := map[string]interface{}{
			"user_id":      userID,
			"is_moderator": boolToInt(isModerator),
			"token":        tokenString,
		}
		if err := m.rdb.HSet(m.ctx, key, fields).Err(); err != nil {
			logrus.Errorf("Failed to save JWT token to Redis: %v", err)
			// Не возвращаем ошибку, чтобы токен все равно работал
			// но логируем проблему
		} else {
			logrus.Infof("JWT token saved to Redis: key=%s, user_id=%d", key, userID)
		}
		// Устанавливаем TTL равный времени жизни токена
		if err := m.rdb.Expire(m.ctx, key, m.tokenDuration).Err(); err != nil {
			logrus.Errorf("Failed to set TTL for JWT token in Redis: %v", err)
		}
	} else {
		logrus.Warn("Redis client is nil, JWT token will not be saved to Redis")
	}

	return tokenString, nil
}

// ValidateToken проверяет и извлекает данные из JWT токена, также проверяет наличие в Redis
func (m *JWTManager) ValidateToken(tokenString string) (*JWTClaims, error) {
	// Сначала проверяем, не отозван ли токен
	if m.rdb != nil {
		tokenHash := m.tokenHash(tokenString)
		key := "jwt:" + tokenHash
		exists, err := m.rdb.Exists(m.ctx, key).Result()
		if err == nil && exists == 0 {
			// Проверяем blacklist
			blacklistKey := "jwt:blacklist:" + tokenHash
			blacklisted, err := m.rdb.Exists(m.ctx, blacklistKey).Result()
			if err == nil && blacklisted > 0 {
				return nil, ErrTokenRevoked
			}
		}
	}

	// Парсим и валидируем токен
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Проверяем метод подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return m.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RevokeToken отзывает токен, добавляя его в blacklist
func (m *JWTManager) RevokeToken(tokenString string) error {
	if m.rdb == nil {
		return nil // Если Redis не настроен, просто игнорируем
	}

	tokenHash := m.tokenHash(tokenString)
	blacklistKey := "jwt:blacklist:" + tokenHash

	// Получаем время истечения токена из самого токена
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		// Если токен невалиден, все равно добавляем в blacklist на случай если он еще не истек
		// Используем стандартное время жизни
		return m.rdb.Set(m.ctx, blacklistKey, "1", m.tokenDuration).Err()
	}

	// Вычисляем оставшееся время до истечения токена
	if claims.ExpiresAt != nil {
		expiresAt := claims.ExpiresAt.Time
		ttl := time.Until(expiresAt)
		if ttl > 0 {
			return m.rdb.Set(m.ctx, blacklistKey, "1", ttl).Err()
		}
	}

	// Если не удалось определить время истечения, используем стандартное
	return m.rdb.Set(m.ctx, blacklistKey, "1", m.tokenDuration).Err()
}

// GetTokenInfo получает информацию о токене из Redis
func (m *JWTManager) GetTokenInfo(tokenString string) (map[string]string, error) {
	if m.rdb == nil {
		return nil, errors.New("redis not configured")
	}

	tokenHash := m.tokenHash(tokenString)
	key := "jwt:" + tokenHash
	return m.rdb.HGetAll(m.ctx, key).Result()
}
