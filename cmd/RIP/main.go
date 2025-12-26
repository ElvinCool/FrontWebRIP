package main

import (
	"context"
	"fmt"
	"strings"

	"RIP/internal/app/config"
	"RIP/internal/app/dsn"
	"RIP/internal/app/handler"
	"RIP/internal/app/repository"
	"RIP/internal/pkg"

	"RIP/internal/app/auth"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

func main() {
	router := gin.Default()

	// Настройка CORS для работы с Tauri и веб-версией
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			// Разрешаем пустой origin (например, для запросов из Postman, curl или same-origin)
			if origin == "" {
				return true
			}

			// Разрешаем Tauri origin
			if origin == "tauri://localhost" {
				return true
			}

			// Разрешаем все localhost origins (IPv4 и IPv6) с любым портом
			// Проверяем localhost, 127.0.0.1, [::1], ::1
			if strings.Contains(origin, "localhost") ||
				strings.Contains(origin, "127.0.0.1") ||
				strings.Contains(origin, "[::1]") ||
				strings.Contains(origin, "::1") {
				return true
			}

			// Разрешаем конкретные известные origins
			knownOrigins := []string{
				"http://localhost:3000",
				"http://127.0.0.1:3000",
				"http://[::1]:3000",
				"http://localhost:5173",
				"http://127.0.0.1:5173",
				"http://[::1]:5173",
				"http://localhost:8080",
				"http://127.0.0.1:8080",
				"http://[::1]:8080",
				"http://192.168.1.94:3000",
				"http://192.168.1.94:5173",
				"http://192.168.1.94:8080",
				"http://192.168.1.94:9000",
				"http://164.215.78.161:3000",
				"http://164.215.78.161:5173",
				"http://164.215.78.161:8080",
				"https://164.215.78.161:8080",
			}
			for _, known := range knownOrigins {
				if origin == known {
					return true
				}
			}

			// Разрешаем любые локальные IP адреса (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
			if strings.HasPrefix(origin, "http://") || strings.HasPrefix(origin, "https://") {
				// Извлекаем хост из origin
				hostPart := origin
				if strings.HasPrefix(origin, "http://") {
					hostPart = origin[7:]
				} else if strings.HasPrefix(origin, "https://") {
					hostPart = origin[8:]
				}
				// Убираем порт
				if colonIdx := strings.Index(hostPart, ":"); colonIdx > 0 {
					hostPart = hostPart[:colonIdx]
				}
				// Убираем путь если есть
				if slashIdx := strings.Index(hostPart, "/"); slashIdx > 0 {
					hostPart = hostPart[:slashIdx]
				}
				// Убираем квадратные скобки для IPv6
				hostPart = strings.Trim(hostPart, "[]")

				// Проверяем локальные сети
				if strings.HasPrefix(hostPart, "192.168.") ||
					strings.HasPrefix(hostPart, "10.") ||
					strings.HasPrefix(hostPart, "172.1") ||
					strings.HasPrefix(hostPart, "172.2") ||
					strings.HasPrefix(hostPart, "172.3") ||
					hostPart == "164.215.78.161" {
					return true
				}
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Cookie", "X-Auth-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	conf, err := config.NewConfig()
	if err != nil {
		logrus.Fatalf("error loading config: %v", err)
	}

	postgresString := dsn.FromEnv()
	fmt.Println(postgresString)

	rep, errRep := repository.New(postgresString)
	if errRep != nil {
		logrus.Fatalf("error initializing repository: %v", errRep)
	}

	hand := handler.NewHandler(rep)

	// init Redis client
	rdb := redis.NewClient(&redis.Options{Addr: conf.RedisAddr, Password: conf.RedisPassword, DB: conf.RedisDB})

	// Проверяем подключение к Redis
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		logrus.Warnf("Redis connection failed: %v. JWT tokens will not be saved to Redis.", err)
	} else {
		logrus.Info("Redis connection established successfully")
	}

	// init JWT manager with Redis
	jwtSecret := conf.JWTSecret
	if jwtSecret == "" {
		jwtSecret = "default-secret-key-change-in-production" // fallback для разработки
	}
	hand.JWT = auth.NewJWTManager(jwtSecret, 24*time.Hour, rdb)

	// init Redis session store (для обратной совместимости, можно удалить позже)
	hand.Session = auth.NewSessionStore(rdb, 24*time.Hour)

	application := pkg.NewApp(conf, router, hand)
	application.RunApp()
}
