# Как работает асинхронный сервис расчета цены

## 📋 Общая схема работы

```
1. Модератор завершает заявку
   ↓
2. Go сервер отправляет запрос в Django сервис
   POST http://localhost:8001/
   {
     "pk": 1,                    // ID LogisticTruck
     "count_logistics": 100,     // Количество километров
     "price_per_km": 50.0       // Цена грузовика за км
   }
   ↓
3. Django сервис сразу отвечает "200 OK" (расчет начат)
   ↓
4. Django сервис считает цену 5-10 секунд в фоне
   Формула: цена = count_logistics × price_per_km × коэффициент
   ↓
5. Django сервис отправляет результат обратно в Go сервер
   PUT http://localhost:8080/api/logistic-trucks/1/price
   {
     "price": 5500.0,
     "token": "secret123"
   }
   ↓
6. Go сервер обновляет цену в базе данных
```

## 🔍 Пошаговая проверка

### Шаг 1: Проверьте, что у грузовика есть цена

```bash
# Проверьте цену грузовика в базе данных
# Или через API:
GET http://localhost:8080/api/truck/1
# Должно быть поле "price" > 0
```

### Шаг 2: Проверьте, что в заявке указаны километры

```bash
# Проверьте заявку:
GET http://localhost:8080/api/logistics/1

# В logistic_trucks должен быть count_logistics > 0
# Например:
{
  "logistic_trucks": [
    {
      "id": 1,
      "count_logistics": 100,  ← Должно быть > 0
      "price": 0,               ← Пока 0, будет рассчитано
      "truck": {
        "price": 50.0           ← Цена грузовика за км
      }
    }
  ]
}
```

### Шаг 3: Завершите заявку (только модератор)

```bash
PUT http://localhost:8080/api/logistics/1/finalize
Authorization: Cookie: sid=...

# Или через другой endpoint:
PUT http://localhost:8080/api/logistics/1/close?status=completed
```

### Шаг 4: Проверьте логи Go сервера

Должны увидеть:
```
INFO: Async price calculation started for LogisticTruck ID 1 (km: 100)
```

Если видите ошибку:
```
ERROR: Failed to call async price service for LogisticTruck ID 1: ...
```
→ Проверьте, что Django сервис запущен на порту 8001

### Шаг 5: Проверьте логи Django сервиса

Должны увидеть:
```
💰 Price calculation: 100 km × 50.0 ₽/km × 1.1 = 5500.0 ₽
Calculation completed for LogisticTruck ID 1, price: 5500.0
✅ Successfully sent price update to Go server for LogisticTruck ID 1: 200
```

Если видите ошибку:
```
❌ Error sending price update to Go server...
```
→ Проверьте, что Go сервер запущен на порту 8080

### Шаг 6: Подождите 5-10 секунд и проверьте заявку снова

```bash
GET http://localhost:8080/api/logistics/1

# Теперь price должна быть рассчитана:
{
  "logistic_trucks": [
    {
      "id": 1,
      "count_logistics": 100,
      "price": 5500.0,  ← Рассчитано!
      ...
    }
  ]
}
```

## 🐛 Частые проблемы

### Проблема 1: Цена грузовика = 0

**Симптом:** В логах Go сервера:
```
ERROR: truck price is zero or negative: 0.000000
```

**Решение:**
1. Проверьте, что у грузовика в базе данных есть цена:
   ```sql
   SELECT id, title, price FROM trucks WHERE id = 1;
   ```
2. Если цена = 0, обновите её:
   ```sql
   UPDATE trucks SET price = 50.0 WHERE id = 1;
   ```

### Проблема 2: count_logistics = 0

**Симптом:** В логах Django:
```
ERROR: count_logistics must be greater than 0
```

**Решение:**
1. Обновите LogisticTruck, указав количество километров:
   ```bash
   PUT http://localhost:8080/api/logistic-truck/1/2
   {
     "count": 100,  ← Укажите километры
     "price": 0,
     "comment": ""
   }
   ```

### Проблема 3: Django сервис не запущен

**Симптом:** В логах Go сервера:
```
ERROR: failed to send request to async service: dial tcp :8001: connect: connection refused
```

**Решение:**
```bash
cd async_service_dir
source ../async_service_env/bin/activate
python manage.py runserver 0.0.0.0:8001
```

### Проблема 4: Callback не работает

**Симптом:** В логах Django:
```
❌ Error sending price update to Go server for LogisticTruck ID 1: 404
```

**Решение:**
1. Проверьте, что Go сервер запущен на порту 8080
2. Проверьте URL в `async_service_dir/app/views.py`:
   ```python
   CALLBACK_URL = "http://localhost:8080/api/logistic-trucks/"
   ```
3. Проверьте, что endpoint зарегистрирован в `handler.go`:
   ```go
   api.PUT("/logistic-trucks/:id/price", h.UpdateLogisticTruckPrice)
   ```

## 🧪 Тестирование вручную

### Тест 1: Проверка Django сервиса

```bash
curl -X POST http://localhost:8001/ \
  -H "Content-Type: application/json" \
  -d '{
    "pk": 1,
    "count_logistics": 100,
    "price_per_km": 50.0
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "calculation_started",
  "logistic_truck_id": 1,
  "count_logistics": 100,
  "price_per_km": 50.0
}
```

Через 5-10 секунд в логах Django должно появиться:
```
✅ Successfully sent price update to Go server for LogisticTruck ID 1: 200
```

### Тест 2: Проверка callback endpoint

```bash
curl -X PUT http://localhost:8080/api/logistic-trucks/1/price \
  -H "Content-Type: application/json" \
  -d '{
    "price": 5500.0,
    "token": "secret123"
  }'
```

**Ожидаемый ответ:**
```json
{
  "status": "price_updated",
  "id": 1,
  "price": 5500.0
}
```

## 📝 Важные моменты

1. **Расчет происходит только при завершении заявки модератором**
   - Не при создании заявки
   - Не при добавлении грузовика
   - Только при `PUT /api/logistics/:id/finalize` или `PUT /api/logistics/:id/close?status=completed`

2. **Цена рассчитывается асинхронно**
   - Go сервер сразу отвечает "завершен"
   - Расчет происходит в фоне 5-10 секунд
   - Результат приходит через callback

3. **Формула расчета:**
   ```
   цена = count_logistics × price_per_km × коэффициент
   где коэффициент = случайное число от 0.8 до 1.2
   минимальная цена = 100 рублей
   ```

4. **Требования:**
   - У грузовика должна быть цена > 0
   - В LogisticTruck должно быть count_logistics > 0
   - Django сервис должен быть запущен на порту 8001
   - Go сервер должен быть запущен на порту 8080

