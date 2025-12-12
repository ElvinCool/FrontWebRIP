import { Api, HttpClient } from './Api';
import { dest_api } from '../target_config';

// Ключ для хранения JWT токена в localStorage
const JWT_TOKEN_KEY = 'jwt_token';

/**
 * Получить JWT токен из localStorage
 */
export const getJWTToken = (): string | null => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

/**
 * Сохранить JWT токен в localStorage
 */
export const setJWTToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(JWT_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(JWT_TOKEN_KEY);
  }
};

/**
 * Настройка Axios HttpClient для работы с API
 * 
 * Axios - это HTTP клиент для выполнения запросов к серверу.
 * HttpClient - обертка над axios, которая настраивается один раз
 * и переиспользуется во всем приложении.
 * 
 * Важные настройки:
 * - baseURL: базовый URL API (http://localhost:8080 или IP адрес)
 * - withCredentials: true - для cookie-based авторизации (fallback)
 * - timeout: максимальное время ожидания ответа (10 секунд)
 * - JWT токен добавляется в заголовок Authorization через interceptor
 */
const httpClient = new HttpClient({
  baseURL: dest_api,
  withCredentials: true, // Для обратной совместимости с cookie-based авторизацией
  timeout: 10000, // 10 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
  },
});

// Убеждаемся, что withCredentials установлен для всех запросов
if (httpClient.instance.defaults) {
  httpClient.instance.defaults.withCredentials = true;
  httpClient.instance.defaults.timeout = 10000; // 10 секунд таймаут
}

// Interceptor для добавления JWT токена в заголовок Authorization
httpClient.instance.interceptors.request.use(
  (config) => {
    const token = getJWTToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок 401 (Unauthorized)
httpClient.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен невалиден или истек - удаляем его
      setJWTToken(null);
      // Можно перенаправить на страницу логина, если нужно
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Api - сгенерированный класс из Swagger схемы
 * Содержит все методы API (users, trucks, logistics и т.д.)
 * 
 * Использование:
 * - api.users.usersLoginCreate({ login, password }) → POST /api/users/login
 * - api.trucks.trucksList() → GET /api/trucks
 * - api.logistics.logisticsList() → GET /api/logistics
 * 
 * Все методы автоматически используют настройки httpClient (withCredentials, timeout)
 * Cookie 'sid' автоматически отправляется с каждым запросом благодаря withCredentials: true
 */
export const api = new Api(httpClient);

// Экспортируем ContentType для использования в других модулях
export { ContentType } from './Api';

