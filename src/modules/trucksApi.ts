import type { TrucksResult, TruckData } from "./getTruckById";
import { TRUCKS_MOCK } from "./mock";
import defaultImage from "../assets/DefaultImage.png";
import { cartMockStore } from "./cartMockStore";
import type { LogisticData, LogisticItemData } from "./logisticTypes";

const API_BASE = "/api";
const STATIC_BASE = "/";

/**
 * Resolves image URL from backend response.
 * Handles MinIO paths (e.g., /img/trucks/...) which are proxied through Vite.
 * Also handles absolute URLs and relative paths.
 */
const resolveImageUrl = (raw?: string | null): string => {
  if (!raw || raw.trim().length === 0) {
    return defaultImage;
  }

  const url = raw.trim();
  
  // Absolute URLs (http/https) - use as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // MinIO paths starting with /img/ - proxy through Vite
  // These are handled by vite.config.ts proxy configuration
  if (url.startsWith("/img/")) {
    return url;
  }

  // Other absolute paths starting with /
  if (url.startsWith("/")) {
    return url;
  }

  // Relative paths - prepend base
  return `${STATIC_BASE.replace(/\/$/, "")}/${url}`;
};

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeTruck = (truck: any): TruckData => {
  if (!truck) {
    return {
      id: -1,
      title: "Неизвестный грузовик",
      preview: "",
      imgURL: defaultImage,
      description: "",
      weight: null,
      price: null,
      length: null,
      width: null,
      height: null,
      year: null,
      status: null,
    };
  }

  const id = truck.id ?? truck.ID ?? truck.Id ?? truck.IdTruck ?? -1;

  return {
    id,
    title: truck.title ?? truck.Title ?? "Без названия",
    preview: truck.preview ?? truck.Preview ?? "",
    imgURL: resolveImageUrl(truck.imgURL ?? truck.ImgURL ?? truck.image ?? truck.Image),
    description: truck.description ?? truck.Description ?? "",
    weight: toNumber(truck.weight ?? truck.Weight),
    price: toNumber(truck.price ?? truck.Price),
    length: toNumber(truck.length ?? truck.Length),
    width: toNumber(truck.width ?? truck.Width),
    height: toNumber(truck.height ?? truck.Height),
    year: toNumber(truck.year ?? truck.Year),
    status: truck.status ?? truck.Status ?? "",
  };
};

const normalizeList = (payload: any): TruckData[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.map(normalizeTruck);
  }

  if (Array.isArray(payload.results)) {
    return payload.results.map(normalizeTruck);
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map(normalizeTruck);
  }

  return [];
};

const normalizeLogisticItem = (item: any): LogisticItemData | null => {
  if (!item) return null;

  const logisticId = item.logisticId ?? item.LogisticID ?? null;
  const truckId = item.truckId ?? item.TruckID ?? null;

  const normalizedTruck = normalizeTruck(item.truck ?? item.Truck);

  return {
    id: item.id ?? item.ID ?? item.Id ?? 0,
    logisticId: logisticId ?? 0,
    truckId: truckId ?? normalizedTruck.id,
    count: toNumber(item.count ?? item.Count ?? item.CountLogistics) ?? 1,
    price: toNumber(item.price ?? item.Price),
    comment: item.comment ?? item.Comment ?? "",
    truck: normalizedTruck,
  };
};

const normalizeLogistic = (payload: any): LogisticData | null => {
  if (!payload) return null;

  if (payload.items && Array.isArray(payload.items)) {
    const items = (payload.items as any[])
      .map((rawItem) => normalizeLogisticItem(rawItem))
      .filter((item): item is LogisticItemData => Boolean(item));
    return {
      id: payload.id ?? payload.ID ?? 0,
      status: payload.status ?? payload.Status ?? "draft",
      items,
      isMock: false,
    };
  }

  if (Array.isArray(payload.LogisticTrucks)) {
    const items = (payload.LogisticTrucks as any[])
      .map((rawItem) => normalizeLogisticItem(rawItem))
      .filter((item): item is LogisticItemData => Boolean(item));
    return {
      id: payload.id ?? payload.ID ?? 0,
      status: payload.status ?? payload.Status ?? "draft",
      items,
      isMock: false,
    };
  }

  return null;
};

const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${text}`);
  }
  return response.json();
};

export const getTrucksList = async (): Promise<TrucksResult> => {
  try {
    const payload = await fetchJson(`${API_BASE}/trucks`, {
      credentials: "include",
    });

    const trucks = normalizeList(payload);

    if (!trucks.length) {
      throw new Error("Empty trucks payload");
    }

    return {
      resultCount: trucks.length,
      results: trucks,
    };
  } catch (error) {
    console.warn("getTrucksList: fallback to mock data", error);
    return TRUCKS_MOCK;
  }
};

export const getTruckById = async (id: number): Promise<TruckData | null> => {
  try {
    const payload = await fetchJson(`${API_BASE}/truck/${id}`, {
      credentials: "include",
    });

    const normalizedList = normalizeList(payload);

    if (Array.isArray(normalizedList) && normalizedList.length > 0) {
      return normalizedList[0];
    }

    if (payload && !Array.isArray(payload)) {
      const normalized = normalizeTruck(payload);
      return normalized;
    }

    return null;
  } catch (error) {
    console.warn(`getTruckById(${id}): fallback to mock data`, error);
    return TRUCKS_MOCK.results.find((truck) => truck.id === id) || null;
  }
};

export const addTruckToCart = async (truckId: number) => {
  try {
    await fetchJson(`${API_BASE}/logistics/draft/add/${truckId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return true;
  } catch (error) {
    console.warn(`addTruckToCart(${truckId}): fallback to mock store`, error);
    cartMockStore.addTruck(truckId);
    return false;
  }
};

export const fetchDraftLogistic = async (): Promise<LogisticData | null> => {
  try {
    const summary = await fetchJson(`${API_BASE}/logistic/draft`, {
      credentials: "include",
    });

    const logisticId = summary?.id ?? summary?.ID;
    if (!logisticId) {
      throw new Error("No draft logistic id in response");
    }

    const logisticPayload = await fetchJson(`${API_BASE}/logistic/${logisticId}`, {
      credentials: "include",
    });

    const logistic = normalizeLogistic(logisticPayload);
    if (!logistic) {
      throw new Error("Unable to normalize logistic payload");
    }

    return logistic;
  } catch (error) {
    console.warn("fetchDraftLogistic: fallback to mock store", error);
    const mock = cartMockStore.getDraft();
    return { ...mock, isMock: true };
  }
};

export const removeTruckFromCart = async (logisticId: number, truckId: number) => {
  try {
    await fetchJson(`${API_BASE}/logistic-truck/${logisticId}/${truckId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return true;
  } catch (error) {
    console.warn(`removeTruckFromCart(${logisticId}, ${truckId}): fallback to mock store`, error);
    cartMockStore.removeTruck(truckId);
    return false;
  }
};

export const deleteDraftLogistic = async (logisticId: number) => {
  try {
    await fetchJson(`${API_BASE}/logistics/${logisticId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return true;
  } catch (error) {
    console.warn(`deleteDraftLogistic(${logisticId}): fallback to mock store`, error);
    cartMockStore.reset();
    return false;
  }
};