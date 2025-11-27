// Конфигурация для переключения между Tauri build и dev режимами
const target_tauri = true; // Установите true для сборки Tauri приложения

// Выбор между localhost и IP адресом
// Для локальной разработки: используйте "localhost"
// Для доступа по сети (мобильное устройство, другой компьютер): используйте IP адрес
const USE_IP = true; // Установите true для использования IP адреса
const SERVER_IP = "192.168.1.94"; // IP адрес вашего сервера

const api_host = USE_IP ? SERVER_IP : "localhost";
const img_host = USE_IP ? SERVER_IP : "localhost";

export const api_proxy_addr = `http://${api_host}:8080`;
export const img_proxy_addr = `http://${img_host}:9000`;

// Для Tauri: полный URL без /api (так как пути в API уже содержат /api)
// Для dev: пустая строка (относительный путь через прокси)
export const dest_api = target_tauri ? api_proxy_addr : "";
export const dest_img = target_tauri ? img_proxy_addr : "img-proxy";
export const dest_root = target_tauri ? "" : "/WebRIP";

