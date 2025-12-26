package repository

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"path/filepath"
	"strings"

	"RIP/internal/app/ds" // 👈 вот этот импорт добавь!

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	Client *minio.Client
	Bucket string
}

func NewMinioClient() *MinioClient {
	endpoint := "localhost:9000"
	accessKeyID := "minio"
	secretAccessKey := "minio124"
	useSSL := false

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalf("❌ Ошибка подключения к MinIO: %v", err)
	}

	bucketName := "trucks"
	location := "us-east-1"
	ctx := context.Background()

	// создаём бакет, если его нет
	err = client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{Region: location})
	if err != nil {
		exists, errBucketExists := client.BucketExists(ctx, bucketName)
		if errBucketExists == nil && exists {
			fmt.Printf("✅ Бакет '%s' уже существует\n", bucketName)
		} else {
			// Логируем ошибку, но не завершаем программу - сервер может работать без MinIO
			fmt.Printf("⚠️  Ошибка создания бакета MinIO: %v (сервер продолжит работу, но загрузка изображений будет недоступна)\n", err)
		}
	} else {
		fmt.Printf("✅ Бакет '%s' создан успешно\n", bucketName)
	}

	return &MinioClient{
		Client: client,
		Bucket: bucketName,
	}
}

func (r *Repository) UploadTruckImage(truckID uint, fileHeader *multipart.FileHeader) (string, error) {
	ctx := context.Background()

	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	// генерируем уникальное имя
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// загружаем в MinIO
	_, err = r.Minio.Client.PutObject(ctx, r.Minio.Bucket, fileName, file, fileHeader.Size,
		minio.PutObjectOptions{ContentType: fileHeader.Header.Get("Content-Type")})
	if err != nil {
		return "", err
	}

	// формируем ссылку
	fileURL := fmt.Sprintf("http://localhost:9000/%s/%s", r.Minio.Bucket, fileName)

	// обновляем БД
	var truck ds.Truck // 👈 исправлено
	if err := r.db.First(&truck, truckID).Error; err != nil {
		return "", err
	}

	// если уже есть изображение — удаляем старое
	if truck.ImgURL != "" {
		oldFile := filepath.Base(truck.ImgURL)
		_ = r.Minio.Client.RemoveObject(ctx, r.Minio.Bucket, oldFile, minio.RemoveObjectOptions{})
	}

	truck.ImgURL = fileURL
	if err := r.db.Save(&truck).Error; err != nil {
		return "", err
	}

	return fileURL, nil
}

func (r *Repository) DeleteTruckImage(truckID uint) error {
	ctx := context.Background()

	var truck ds.Truck // 👈 исправлено
	if err := r.db.First(&truck, truckID).Error; err != nil {
		return err
	}

	if truck.ImgURL == "" {
		return nil
	}

	fileName := filepath.Base(truck.ImgURL)
	err := r.Minio.Client.RemoveObject(ctx, r.Minio.Bucket, fileName, minio.RemoveObjectOptions{})
	if err != nil {
		return err
	}

	truck.ImgURL = ""
	return r.db.Save(&truck).Error
}
