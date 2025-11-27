export const ROUTES = {
    HOME: "/",
    ALBUMS: "/trucks",
    LOGISTICS: "/logistics/draft",
    LOGIN: "/login",
    REGISTER: "/register",
    PROFILE: "/profile",
    LOGISTICS_LIST: "/logistics",
  }
  export type RouteKeyType = keyof typeof ROUTES;
  export const ROUTE_LABELS: {[key in RouteKeyType]: string} = {
    HOME: "Главная",
    ALBUMS: "Грузовики",
    LOGISTICS: "Заявка",
    LOGIN: "Авторизация",
    REGISTER: "Регистрация",
    PROFILE: "Профиль",
    LOGISTICS_LIST: "Мои заявки",
  };