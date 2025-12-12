import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { Route, Routes } from "react-router-dom"
import type { AppDispatch } from "./store"
import TruckDetPage  from "./pages/TruckDetPage"
import { ROUTES } from "../Routes"
import HomeLogisticPage from "./pages/HomeLogisticPage"
import TrucksPage from "./pages/TrucksPage"
import LogisticDraftPage from "./pages/LogisticDraftPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import LogisticsListPage from "./pages/LogisticsListPage"
import ProfilePage from "./pages/ProfilePage"
import { checkAuth, getCurrentUserAsync } from "./slices/userSlice"

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Проверяем наличие JWT токена при загрузке приложения
    dispatch(checkAuth());
    // Пытаемся получить данные пользователя, если токен есть
    const token = localStorage.getItem('jwt_token');
    if (token) {
      dispatch(getCurrentUserAsync());
    }
  }, [dispatch]);

  useEffect(() => {
    // Определение Tauri согласно методическим указаниям (Шаг 2)
    // В Tauri 2.0 проверка наличия Tauri через проверку window.__TAURI__
    const checkTauri = async () => {
      try {
        // Проверяем наличие Tauri API
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          console.log("Tauri launched");
          // Можно использовать Tauri API
        } else {
          console.log("Tauri not launched - running in browser");
        }
      } catch (e) {
        // Not running in Tauri - это нормально для браузера
        console.log("Running in browser, not Tauri");
      }
    };
    
    checkTauri();
  }, [])

  return (
    <Routes>
      <Route path={ROUTES.HOME} index element={<HomeLogisticPage />} />
      <Route path={ROUTES.ALBUMS} element={<TrucksPage />} />
      <Route path={`${ROUTES.ALBUMS}/:id`} element={<TruckDetPage />} />
      <Route path={ROUTES.LOGISTICS} element={<LogisticDraftPage />} />
      <Route path={`${ROUTES.LOGISTICS}/:id`} element={<LogisticDraftPage />} />
      <Route path={ROUTES.LOGISTICS_LIST} element={<LogisticsListPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
    </Routes>
  )
}

export default App