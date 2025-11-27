export const ROUTES = {
    HOME: "/",
    ALBUMS: "/trucks",
    LOGISTICS: "/logistics/draft",
  }
  export type RouteKeyType = keyof typeof ROUTES;
  export const ROUTE_LABELS: {[key in RouteKeyType]: string} = {
    HOME: "Главная",
    ALBUMS: "Грузовики",
    LOGISTICS: "Заявка",
  };