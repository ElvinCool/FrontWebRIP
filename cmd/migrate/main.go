package main

import (
	"log"

	"RIP/internal/app/ds"
	"RIP/internal/app/dsn"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found — using environment variables")
	}

	db, err := gorm.Open(postgres.Open(dsn.FromEnv()), &gorm.Config{})
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	log.Println("database connected")

	err = db.AutoMigrate(
		&ds.User{},
		&ds.Truck{},
		&ds.Logistic{},
		&ds.LogisticTruck{},
	)
	if err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	log.Println("migration completed successfully")
}
