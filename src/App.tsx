import { useEffect } from "react"
import { Route, Routes } from "react-router-dom"
import TruckDetPage  from "./pages/TruckDetPage"
import { ROUTES } from "../Routes"
import HomeLogisticPage from "./pages/HomeLogisticPage"
import TrucksPage from "./pages/TrucksPage"
import LogisticDraftPage from "./pages/LogisticDraftPage"

function App() {
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
    </Routes>
  )
}

export default App