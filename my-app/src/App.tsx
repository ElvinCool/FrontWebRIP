import { Route, Routes } from "react-router-dom"
import TruckDetPage  from "./pages/TruckDetPage"
import { ROUTES } from "../Routes"
import HomeLogisticPage from "./pages/HomeLogisticPage"
import TrucksPage from "./pages/TrucksPage"
import LogisticDraftPage from "./pages/LogisticDraftPage"

function App() {
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