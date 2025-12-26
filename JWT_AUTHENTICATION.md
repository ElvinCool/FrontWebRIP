# JWT Authentication

Проект теперь использует JWT (JSON Web Tokens) для аутентификации пользователей.

## Как это работает

### 1. Логин и получение токена

При успешном логине через `POST /api/users/login` сервер возвращает JWT токен:

```json
{
  "status": "logged in",
  "user_id": 1,
  "isModerator": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Использование токена

Для авторизованных запросов необходимо отправлять токен в заголовке `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

Или просто:

```
Authorization: <your-jwt-token>
```

### 3. Пример запроса

```bash
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Время жизни токена

Токен действителен в течение **24 часов** с момента выдачи.

### 5. Логаут

JWT токены являются stateless, поэтому логаут (`POST /api/users/logout`) просто возвращает успех. Клиент должен удалить токен на своей стороне.

## Конфигурация

Секретный ключ для подписи JWT токенов настраивается в `config/config.toml`:

```toml
JWTSecret = "your-secret-key-change-in-production"
```

**Важно:** В production обязательно измените секретный ключ на безопасный случайный ключ!

## Обратная совместимость

Система поддерживает обратную совместимость со старыми сессиями через Redis:
- Если JWT токен не предоставлен, система попытается использовать cookie `sid` (старая система сессий)
- Если и cookie нет, система попытается использовать legacy cookie `user_id`

## Структура JWT токена

Токен содержит следующие данные:
- `user_id` - ID пользователя
- `is_moderator` - флаг модератора
- `exp` - время истечения (24 часа)
- `iat` - время выдачи
- `nbf` - время начала действия

## Хранение в Redis

JWT токены теперь сохраняются в Redis для возможности их отзыва:

- **Активные токены**: хранятся с ключом `jwt:<token-hash>`
- **Отозванные токены**: хранятся в blacklist с ключом `jwt:blacklist:<token-hash>`
- При логауте токен автоматически добавляется в blacklist
- Токены автоматически удаляются из Redis после истечения

### Просмотр токенов в Redis

Используйте утилиту `redis-inspect`:

```bash
go run cmd/redis-inspect/main.go
```

Или скомпилированную версию:

```bash
./redis-inspect
```

Утилита покажет:
- Все активные сессии (старая система)
- Все активные JWT токены
- Все отозванные JWT токены (blacklist)

### Прямой просмотр через Redis CLI

```bash
# Все JWT токены
redis-cli KEYS "jwt:*"

# Конкретный токен
redis-cli HGETALL "jwt:<token-hash>"

# Blacklist
redis-cli KEYS "jwt:blacklist:*"
```

## Безопасность

- Токены подписываются с использованием алгоритма HS256
- Токены содержат время истечения
- Токены можно отозвать через blacklist в Redis
- Секретный ключ должен храниться в безопасности
- В production используйте HTTPS для передачи токенов

