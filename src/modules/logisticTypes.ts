import type { TruckData } from "./getTruckById";

export interface LogisticItemData {
  id: number;
  logisticId: number;
  truckId: number;
  count: number; // distance (километры) - для обратной совместимости
  distance?: number; // расстояние в километрах
  countLogistics?: number; // количество машин
  price?: number | null;
  comment?: string | null;
  truck: TruckData;
}

export interface LogisticData {
  id: number;
  status?: string | null;
  items: LogisticItemData[];
  isMock?: boolean;
}
