# Tauri Setup для WebRIP

Этот проект настроен для работы с Tauri 2.0.

## Установка

1. Убедитесь, что установлены:
   - Node.js и npm
   - Rust и Cargo
   - Tauri CLI (установлен через npm)

2. Установите зависимости:
```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run tauri dev
```

Это запустит:
- React dev сервер на http://localhost:3000
- Tauri приложение, подключенное к dev серверу

## Сборка приложения

```bash
npm run tauri build
```

Собранное приложение будет в `src-tauri/target/release/bundle/`

## Конфигурация

### Переключение между режимами

В файле `src/target_config.ts` можно переключить `target_tauri` на `true` для сборки Tauri приложения. Это изменит:
- Базовый путь роутера (убирает `/WebRIP`)
- Прямые URL для API запросов (вместо прокси)
- Прямые URL для изображений

### API конфигурация

- Dev режим: использует прокси из `vite.config.ts`
- Build режим: использует прямые URL из `target_config.ts`

## Структура

- `src-tauri/` - Rust код и конфигурация Tauri
- `src/target_config.ts` - Конфигурация для переключения режимов
- `vite.config.ts` - Обновлен для поддержки Tauri

## Примечания

- Для работы в build режиме убедитесь, что бэкенд доступен по адресу, указанному в `target_config.ts`
- CORS настроен в `src-tauri/capabilities/default.json`
- HTTP плагины включены для работы с внешними API

