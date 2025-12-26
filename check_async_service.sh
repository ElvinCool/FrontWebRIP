#!/bin/bash

echo "🔍 Проверка асинхронного сервиса расчета цены"
echo "================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка 1: Django сервис запущен?
echo "1. Проверка Django сервиса (порт 8001)..."
if lsof -ti:8001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Django сервис запущен${NC}"
else
    echo -e "${RED}❌ Django сервис НЕ запущен${NC}"
    echo "   Запустите: cd async_service_dir && python manage.py runserver 0.0.0.0:8001"
fi
echo ""

# Проверка 2: Go сервер запущен?
echo "2. Проверка Go сервера (порт 8080)..."
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Go сервер запущен${NC}"
else
    echo -e "${RED}❌ Go сервер НЕ запущен${NC}"
fi
echo ""

# Проверка 3: Тест Django сервиса
echo "3. Тест Django сервиса..."
response=$(curl -s -X POST http://localhost:8001/ \
  -H "Content-Type: application/json" \
  -d '{"pk": 999, "count_logistics": 100, "price_per_km": 50.0}' \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Django сервис отвечает${NC}"
    echo "   Ответ: $body"
else
    echo -e "${RED}❌ Django сервис не отвечает (код: $http_code)${NC}"
    echo "   Ответ: $body"
fi
echo ""

# Проверка 4: Тест callback endpoint
echo "4. Тест callback endpoint (Go сервер)..."
response=$(curl -s -X PUT http://localhost:8080/api/logistic-trucks/999/price \
  -H "Content-Type: application/json" \
  -d '{"price": 5500.0, "token": "secret123"}' \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Callback endpoint работает${NC}"
    else
        echo -e "${YELLOW}⚠️  Callback endpoint работает, но LogisticTruck ID 999 не найден (это нормально)${NC}"
    fi
    echo "   Ответ: $body"
else
    echo -e "${RED}❌ Callback endpoint не работает (код: $http_code)${NC}"
    echo "   Ответ: $body"
fi
echo ""

echo "================================================"
echo "📝 Следующие шаги:"
echo ""
echo "1. Убедитесь, что у грузовиков есть цена > 0"
echo "2. Убедитесь, что в LogisticTruck указано count_logistics > 0"
echo "3. Завершите заявку через: PUT /api/logistics/:id/finalize"
echo "4. Подождите 5-10 секунд"
echo "5. Проверьте заявку: GET /api/logistics/:id"
echo ""
echo "Подробная инструкция: см. ASYNC_SERVICE_WORKFLOW.md"

