// Конфигурация для переключения между Tauri build и dev режимами
const target_tauri = true; // Установите true для сборки Tauri приложения

export const api_proxy_addr = "http://localhost:8080";
export const img_proxy_addr = "http://localhost:9000";

// Для Tauri: полный URL с /api, для dev: относительный путь через прокси
export const dest_api = target_tauri ? `${api_proxy_addr}/api` : "api";
export const dest_img = target_tauri ? img_proxy_addr : "img-proxy";
export const dest_root = target_tauri ? "" : "/WebRIP";

