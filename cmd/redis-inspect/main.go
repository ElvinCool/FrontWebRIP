package main

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	fmt.Println("=== Redis Sessions ===")
	sessionKeys, err := rdb.Keys(ctx, "session:*").Result()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Found %d sessions\n", len(sessionKeys))
	for _, k := range sessionKeys {
		vals, _ := rdb.HGetAll(ctx, k).Result()
		ttl, _ := rdb.TTL(ctx, k).Result()
		sid := k[8:] // убираем префикс "session:"
		fmt.Printf("Session ID: %s\n", sid)
		fmt.Printf("  User ID: %s\n", vals["user_id"])
		fmt.Printf("  Is Moderator: %s\n", vals["is_moderator"])
		if ttl > 0 {
			fmt.Printf("  TTL: %v\n", ttl)
		} else {
			fmt.Printf("  TTL: expired\n")
		}
		fmt.Println()
	}

	fmt.Println("=== JWT Tokens ===")
	jwtKeys, err := rdb.Keys(ctx, "jwt:*").Result()
	if err != nil {
		panic(err)
	}
	// Фильтруем только активные токены (не blacklist)
	var activeJWTKeys []string
	for _, k := range jwtKeys {
		if len(k) > 11 && k[:11] != "jwt:blacklist" {
			activeJWTKeys = append(activeJWTKeys, k)
		}
	}
	fmt.Printf("Found %d active JWT tokens\n", len(activeJWTKeys))
	for _, k := range activeJWTKeys {
		vals, _ := rdb.HGetAll(ctx, k).Result()
		ttl, _ := rdb.TTL(ctx, k).Result()
		tokenHash := k[4:] // убираем префикс "jwt:"
		fmt.Printf("Token Hash: %s\n", tokenHash)
		fmt.Printf("  User ID: %s\n", vals["user_id"])
		fmt.Printf("  Is Moderator: %s\n", vals["is_moderator"])
		if ttl > 0 {
			hours := int(ttl.Hours())
			minutes := int(ttl.Minutes()) % 60
			fmt.Printf("  TTL: %dh %dm\n", hours, minutes)
		} else {
			fmt.Printf("  TTL: expired\n")
		}
		fmt.Println()
	}

	fmt.Println("=== JWT Blacklist ===")
	blacklistKeys, err := rdb.Keys(ctx, "jwt:blacklist:*").Result()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Found %d revoked JWT tokens\n", len(blacklistKeys))
	for _, k := range blacklistKeys {
		ttl, _ := rdb.TTL(ctx, k).Result()
		tokenHash := k[14:] // убираем префикс "jwt:blacklist:"
		fmt.Printf("Revoked Token Hash: %s\n", tokenHash)
		if ttl > 0 {
			hours := int(ttl.Hours())
			minutes := int(ttl.Minutes()) % 60
			fmt.Printf("  TTL: %dh %dm (until expiration)\n", hours, minutes)
		} else {
			fmt.Printf("  TTL: expired\n")
		}
		fmt.Println()
	}

	fmt.Println("=== Summary ===")
	fmt.Printf("Total sessions: %d\n", len(sessionKeys))
	fmt.Printf("Active JWT tokens: %d\n", len(activeJWTKeys))
	fmt.Printf("Revoked JWT tokens: %d\n", len(blacklistKeys))
}
