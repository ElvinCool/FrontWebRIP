from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import time
import random
import requests
from concurrent import futures

# URL основного Go сервера для отправки результатов
CALLBACK_URL = "http://localhost:8080/api/logistic-trucks/"
# Токен для псевдо-авторизации (8 байт)
AUTH_TOKEN = "secret123"

executor = futures.ThreadPoolExecutor(max_workers=1)

def calculate_price(pk, count_logistics, price_per_km):
    """
    Долгая задача для расчета цены LogisticTruck на основе километров.
    Выполняется с задержкой 5-10 секунд.
    
    Формула расчета: цена = количество_км * цена_грузовика_за_км * коэффициент
    """
    # Случайная задержка от 5 до 10 секунд
    delay = random.uniform(5, 10)
    time.sleep(delay)
    
    # Используем цену грузовика за километр, переданную из Go сервера
    if price_per_km <= 0:
        # Если цена не передана или некорректна, используем случайную базовую цену
        price_per_km = random.uniform(50.0, 150.0)
        print(f"⚠️ Warning: Invalid price_per_km, using random base price: {price_per_km}")
    
    # Коэффициент (случайный для разнообразия, учитывает различные факторы)
    coefficient = random.uniform(0.8, 1.2)
    
    # Расчет цены на основе километров и цены грузовика
    # price = количество_км * цена_грузовика_за_км * коэффициент
    calculated_price = count_logistics * price_per_km * coefficient
    
    # Минимальная цена (если километров мало)
    min_price = 100.0
    calculated_price = max(calculated_price, min_price)
    
    print(f"💰 Price calculation: {count_logistics} km × {price_per_km} ₽/km × {coefficient} = {calculated_price} ₽")
    
    return {
        "id": pk,
        "price": round(calculated_price, 2),
    }

def price_callback(task):
    """
    Колбэк для отправки результата расчета обратно на Go сервер.
    """
    try:
        result = task.result()
        print(f"Calculation completed for LogisticTruck ID {result['id']}, price: {result['price']}")
    except futures._base.CancelledError:
        return
    
    # Отправляем PUT запрос на Go сервер
    nurl = str(CALLBACK_URL + str(result["id"]) + "/price")
    answer = {
        "price": result["price"],
        "token": AUTH_TOKEN  # Отправляем токен для авторизации (псевдо-токен)
    }
    print(f"🔑 Sending pseudo-token for LogisticTruck ID {result['id']}: '{AUTH_TOKEN}'")
    
    try:
        response = requests.put(nurl, json=answer, timeout=5)
        if response.status_code == 200:
            print(f"✅ Successfully sent price update to Go server for LogisticTruck ID {result['id']}: {response.status_code}")
        elif response.status_code == 404:
            print(f"⚠️ LogisticTruck ID {result['id']} not found in Go server (may have been deleted)")
        else:
            print(f"❌ Error sending price update to Go server for LogisticTruck ID {result['id']}: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data}")
            except:
                print(f"   Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error sending price update for LogisticTruck ID {result['id']}: {e}")

@api_view(['POST'])
def calculate_logistic_truck_price(request):
    """
    Асинхронный метод для расчета цены LogisticTruck на основе километров.
    Принимает POST запрос с полями:
    - 'pk' (ID LogisticTruck) - обязательное
    - 'count_logistics' (количество километров) - обязательное
    - 'price_per_km' (цена грузовика за километр) - обязательное
    """
    # Логирование входящих данных для отладки
    print(f"📥 Received request data: {request.data}")
    print(f"📥 Request data keys: {list(request.data.keys())}")
    print(f"📥 Request content type: {request.content_type}")
    
    # Проверка наличия обязательных полей
    if "pk" not in request.data.keys():
        error_msg = f"❌ Missing 'pk' field. Received keys: {list(request.data.keys())}"
        print(error_msg)
        return Response(
            {"error": "pk field is required", "received_keys": list(request.data.keys())},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if "count_logistics" not in request.data.keys():
        error_msg = f"❌ Missing 'count_logistics' field. Received keys: {list(request.data.keys())}"
        print(error_msg)
        return Response(
            {"error": "count_logistics field is required", "received_keys": list(request.data.keys())},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if "price_per_km" not in request.data.keys():
        error_msg = f"❌ Missing 'price_per_km' field. Received keys: {list(request.data.keys())}"
        print(error_msg)
        return Response(
            {"error": "price_per_km field is required", "received_keys": list(request.data.keys())},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        pk = request.data["pk"]
        count_logistics = request.data["count_logistics"]
        price_per_km = request.data["price_per_km"]
        
        print(f"📊 Parsed values: pk={pk}, count_logistics={count_logistics}, price_per_km={price_per_km}")
        print(f"📊 Types: pk={type(pk)}, count_logistics={type(count_logistics)}, price_per_km={type(price_per_km)}")
        
        # Преобразуем в нужные типы
        try:
            pk = int(pk)
            count_logistics = int(count_logistics) if isinstance(count_logistics, (int, float, str)) else count_logistics
            price_per_km = float(price_per_km) if isinstance(price_per_km, (int, float, str)) else price_per_km
        except (ValueError, TypeError) as e:
            error_msg = f"❌ Type conversion error: {e}"
            print(error_msg)
            return Response(
                {"error": f"Invalid data types: {str(e)}", "pk": pk, "count_logistics": count_logistics, "price_per_km": price_per_km},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка валидности количества километров
        if count_logistics <= 0:
            error_msg = f"❌ Invalid count_logistics: {count_logistics} (must be > 0)"
            print(error_msg)
            return Response(
                {"error": "count_logistics must be greater than 0", "value": count_logistics},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка валидности цены за километр
        if price_per_km <= 0:
            error_msg = f"❌ Invalid price_per_km: {price_per_km} (must be > 0)"
            print(error_msg)
            return Response(
                {"error": "price_per_km must be greater than 0", "value": price_per_km},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except KeyError as e:
        error_msg = f"❌ KeyError: {e}"
        print(error_msg)
        return Response(
            {"error": f"Missing field: {str(e)}", "received_keys": list(request.data.keys())},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        error_msg = f"❌ Unexpected error: {e}"
        print(error_msg)
        import traceback
        print(traceback.format_exc())
        return Response(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Запускаем долгую задачу в фоновом режиме
    print(f"✅ Starting async price calculation for LogisticTruck ID {pk}: {count_logistics} km × {price_per_km} ₽/km")
    task = executor.submit(calculate_price, pk, count_logistics, price_per_km)
    task.add_done_callback(price_callback)
    
    # Сразу возвращаем ответ 200 OK
    response_data = {
        "status": "calculation_started",
        "logistic_truck_id": pk,
        "count_logistics": count_logistics,
        "price_per_km": price_per_km
    }
    print(f"✅ Returning response: {response_data}")
    return Response(response_data, status=status.HTTP_200_OK)
