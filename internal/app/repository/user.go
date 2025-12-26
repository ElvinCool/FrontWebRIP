package repository

import (
	"RIP/internal/app/ds"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

func (r *Repository) CreateUser(login, password string) (ds.User, error) {
	// хэшируем пароль
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return ds.User{}, err
	}

	user := ds.User{
		Login:    login,
		Password: string(hash),
	}

	if err := r.db.Create(&user).Error; err != nil {
		return ds.User{}, err
	}

	return user, nil
}

func (r *Repository) GetUserByLogin(login string) (ds.User, error) {
	var user ds.User
	err := r.db.Where("login = ?", login).First(&user).Error
	if err != nil {
		return ds.User{}, err
	}
	return user, nil
}

func (r *Repository) GetUserByID(id uint) (ds.User, error) {
	var user ds.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return ds.User{}, err
	}
	return user, nil
}

func (r *Repository) UpdateUser(user ds.User) error {
	return r.db.Save(&user).Error
}

func (r *Repository) AuthenticateUser(login, password string) (ds.User, error) {
	user, err := r.GetUserByLogin(login)
	if err != nil {
		return ds.User{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return ds.User{}, errors.New("wrong password")
	}

	return user, nil
}
