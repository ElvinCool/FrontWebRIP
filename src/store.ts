import { combineReducers, configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import userReducer from "./slices/userSlice";
import logisticsReducer from "./slices/logisticsSlice";

/**
 * Redux Store - централизованное хранилище состояния приложения
 * 
 * Redux - библиотека для управления глобальным состоянием.
 * Redux Toolkit упрощает работу с Redux, предоставляя готовые инструменты.
 * 
 * Структура store:
 * - cart: состояние корзины (для неавторизованных пользователей)
 * - user: состояние пользователя (авторизация, данные пользователя)
 * - logistics: состояние логистических заявок
 * 
 * configureStore создает store с предустановленными middleware:
 * - Redux Thunk (для асинхронных действий)
 * - Redux DevTools (для отладки)
 * 
 * combineReducers объединяет несколько редьюсеров в один корневой редьюсер.
 * Каждый редьюсер управляет своей частью состояния.
 */
const store = configureStore({
  reducer: combineReducers({
    cart: cartReducer,        // Состояние корзины
    user: userReducer,         // Состояние пользователя (авторизация)
    logistics: logisticsReducer, // Состояние логистических заявок
  }),
});

/**
 * Типы для TypeScript
 * 
 * RootState - тип всего состояния store
 * Используется в useSelector: useSelector((state: RootState) => state.user)
 * 
 * AppDispatch - тип функции dispatch
 * Используется в useDispatch: const dispatch = useDispatch<AppDispatch>()
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

