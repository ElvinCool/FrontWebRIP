# Быстрая проверка в Postman (4 запроса)

## Минимальный тест асинхронного сервиса

### 1️⃣ Получить заявку (ДО расчета)
```
GET http://localhost:8080/api/logistics/1
```
**Смотрите:** 
- `logistic_trucks[0].price` = `0`
- `logistic_trucks[0].distance` = должно быть установлено (например, `250`)

### 2️⃣ Установить расстояние (если не установлено)
```
PUT http://localhost:8080/api/logistics/1/save
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
**Нужно:** Авторизация пользователя (cookie)

**Ответ:** `{"status": "сформирован"}`

### 3️⃣ Завершить заявку (запускает расчет)
```
PUT http://localhost:8080/api/logistics/1/finalize
```
**Нужно:** Авторизация как модератор (cookie)

**Ответ:** `{"status": "завершен"}` ← **Сразу!**

### 4️⃣ Получить заявку снова (ПОСЛЕ расчета)
```
GET http://localhost:8080/api/logistics/1
```
⏱️ **Подождите 10 секунд** после шага 3!

**Смотрите:** 
- `logistic_trucks[0].price` = **число > 0** (например, `501.96`) ✅
- `logistic_trucks[0].distance` = `250` (сохранилось) ✅

---

## Визуально в Postman

**До расчета:**
```json
{
  "price": 0,
  "distance": 250
}
```

**После расчета (через 10 сек):**
```json
{
  "price": 501.96,  ← ИЗМЕНИЛОСЬ!
  "distance": 250   ← СОХРАНИЛОСЬ
}
```

**Вот и всё!** 🎉

## Важно

⚠️ **Теперь используется `distance` (километры), а не `count_logistics`!**

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
