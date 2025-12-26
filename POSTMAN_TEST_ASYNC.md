# Тестирование асинхронного сервиса в Postman

## Быстрая проверка (пошагово)

### Шаг 1: Подготовка

1. **Убедитесь, что серверы запущены:**
   - Go сервер: `http://localhost:8080`
   - Django сервис: `http://localhost:8001`

2. **Создайте переменную окружения в Postman:**
   - `base_url` = `http://localhost:8080`
   - `django_url` = `http://localhost:8001`

### Шаг 2: Авторизация

**1. Вход пользователя:**
```
POST {{base_url}}/api/users/login
Content-Type: application/json

{
  "login": "testuser",
  "password": "test123"
}
```
✅ Сохраните cookie из ответа (Postman делает это автоматически)

### Шаг 3: Создание заявки с грузовиками

**2. Получить черновик заявки:**
```
GET {{base_url}}/api/logistic/draft
```
✅ Запомните `id` заявки из ответа (например, `{"id": 1, "service_count": 0}`)

**3. Добавить грузовик в черновик:**
```
POST {{base_url}}/api/logistics/draft/add/1
```
(Замените `1` на реальный ID грузовика из `/api/trucks`)

**4. Установить расстояние (distance) для грузовика:**
```
PUT {{base_url}}/api/logistics/1/save
Content-Type: application/json

{
  "logistic_trucks": [
    {
      "truck_id": 1,
      "distance": 250
    }
  ]
}
```
(Замените `1` на ID заявки, `truck_id: 1` на реальный ID грузовика, `distance: 250` на нужное расстояние в км)

✅ **ВАЖНО:** Теперь используется `distance` (километры), а не `count_logistics` (количество машин)!

**5. Сохранить заявку (статус -> "сформирован"):**
```
PUT {{base_url}}/api/logistics/1/save
Content-Type: application/json

{
  "logistic_trucks": [
    {
      "truck_id": 1,
      "distance": 250
    }
  ]
}
```
(Можно объединить с шагом 4 - установка distance и сохранение в одном запросе)

### Шаг 4: Проверка ДО расчета (цены = 0)

**6. Получить заявку и посмотреть цены:**
```
GET {{base_url}}/api/logistics/1
```
(Замените `1` на ID заявки)

✅ **Проверьте в ответе:**
- `logistic_trucks[0].price` = `0` (или отсутствует)
- `logistic_trucks[0].distance` = `250` (установленное значение)
- `calculated_count` = `0`

**Пример ответа:**
```json
{
  "id": 1,
  "status": "сформирован",
  "logistic_trucks": [
    {
      "id": 2,
      "truck_id": 1,
      "price": 0,
      "distance": 250,
      "count_logistics": 1
    }
  ],
  "calculated_count": 0
}
```

### Шаг 5: Запуск асинхронного расчета (МОДЕРАТОР)

⚠️ **ВАЖНО:** Нужна авторизация как модератор!

**7. Войти как модератор:**
```
POST {{base_url}}/api/users/login
Content-Type: application/json

{
  "login": "moderator",
  "password": "mod123"
}
```

**8. Завершить заявку (запускает расчет):**
```
PUT {{base_url}}/api/logistics/1/finalize
```
(Замените `1` на ID заявки)

✅ **Сразу вернется ответ:** `{"status": "завершен"}`

⏱️ **Подождите 5-10 секунд** (расчет выполняется асинхронно)

### Шаг 6: Проверка ПОСЛЕ расчета (цены обновлены)

**9. Получить заявку снова:**
```
GET {{base_url}}/api/logistics/1
```

✅ **Проверьте в ответе:**
- `logistic_trucks[0].price` = **число > 0** (например, `501.96`)
- `logistic_trucks[0].distance` = `250` (сохранилось)
- `calculated_count` = **количество LogisticTrucks с рассчитанными ценами**

**Пример ответа после расчета:**
```json
{
  "id": 1,
  "status": "завершен",
  "logistic_trucks": [
    {
      "id": 2,
      "truck_id": 1,
      "price": 501.96,  ← ЦЕНА ОБНОВЛЕНА!
      "distance": 250,  ← РАССТОЯНИЕ СОХРАНИЛОСЬ
      "count_logistics": 1
    }
  ],
  "calculated_count": 1  ← УВЕЛИЧИЛОСЬ!
}
```

## Прямое тестирование Django сервиса

**10. Прямой вызов Django сервиса:**
```
POST {{django_url}}/
Content-Type: application/json

{
  "pk": 2,
  "count_logistics": 250,
  "price_per_km": 100.0
}
```
(Замените `2` на реальный ID LogisticTruck, `count_logistics` на расстояние в км, `price_per_km` на цену грузовика за км)

✅ Должен вернуть: 
```json
{
  "status": "calculation_started",
  "logistic_truck_id": 2,
  "count_logistics": 250,
  "price_per_km": 100.0
}
```

⏱️ Подождите 5-10 секунд, затем проверьте заявку снова (шаг 9)

## Проверка обновления цены напрямую

**11. Обновить цену вручную (с токеном):**
```
PUT {{base_url}}/api/logistic-trucks/2/price
Content-Type: application/json

{
  "price": 999.99,
  "token": "secret123"
}
```
(Замените `2` на ID LogisticTruck)

✅ Должен вернуть: `{"status": "price_updated", "id": 2, "price": 999.99}`

**12. Проверить обновленную цену:**
```
GET {{base_url}}/api/logistics/1
```
✅ В ответе `logistic_trucks[0].price` должно быть `999.99`

## Что смотреть в ответах

### До расчета:
```json
{
  "logistic_trucks": [
    {
      "id": 2,
      "price": 0,  ← НУЛЕВАЯ ЦЕНА
      "distance": 250  ← РАССТОЯНИЕ УСТАНОВЛЕНО
    }
  ],
  "calculated_count": 0  ← НОЛЬ
}
```

### После расчета:
```json
{
  "logistic_trucks": [
    {
      "id": 2,
      "price": 501.96,  ← ЦЕНА РАССЧИТАНА!
      "distance": 250  ← РАССТОЯНИЕ СОХРАНИЛОСЬ
    }
  ],
  "calculated_count": 1  ← УВЕЛИЧИЛОСЬ!
}
```

## Быстрая проверка (минимум запросов)

1. **Войти:** `POST /api/users/login`
2. **Получить заявку:** `GET /api/logistics/1` (запомните `logistic_trucks[0].id` и проверьте, что `distance` установлен)
3. **Если distance = 0, установите его:**
   ```
   PUT /api/logistics/1/save
   {
     "logistic_trucks": [{"truck_id": 1, "distance": 250}]
   }
   ```
4. **Войти как модератор:** `POST /api/users/login` (с данными модератора)
5. **Завершить (модератор):** `PUT /api/logistics/1/finalize`
6. **Подождать 10 секунд**
7. **Проверить снова:** `GET /api/logistics/1` ← **ЦЕНА ДОЛЖНА ИЗМЕНИТЬСЯ!**

## Важные изменения

⚠️ **Теперь используется:**
- `distance` (float) - **расстояние в километрах** для расчета цены
- `count_logistics` (int) - **количество машин** (не для расчета цены!)

При сохранении заявки отправляйте:
```json
{
  "logistic_trucks": [
    {
      "truck_id": 1,
      "distance": 250  ← КИЛОМЕТРЫ
    }
  ]
}
```

## Советы

- Используйте **Environment Variables** в Postman для `base_url`
- Сохраняйте cookie автоматически (Postman делает это)
- Используйте **Tests** в Postman для автоматической проверки цен
- Смотрите логи обоих серверов для отладки

## Пример Test скрипта в Postman

Для запроса `GET /api/logistics/1` добавьте в Tests:

```javascript
// Проверка, что цена рассчитана
const jsonData = pm.response.json();
const firstTruck = jsonData.logistic_trucks[0];

if (firstTruck && firstTruck.price > 0) {
    console.log("✅ Цена рассчитана:", firstTruck.price);
    console.log("✅ Расстояние:", firstTruck.distance);
    pm.test("Price is calculated", function () {
        pm.expect(firstTruck.price).to.be.above(0);
    });
    pm.test("Distance is set", function () {
        pm.expect(firstTruck.distance).to.be.above(0);
    });
} else {
    console.log("⚠️ Цена еще не рассчитана:", firstTruck.price);
    console.log("⚠️ Расстояние:", firstTruck.distance);
}
```
