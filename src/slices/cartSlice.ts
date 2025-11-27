import { createSlice } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { LogisticData, LogisticItemData } from "../modules/logisticTypes";
import { TRUCKS_MOCK } from "../modules/mock";

let draftIdCounter = 1000;
let logisticItemCounter = 1;

interface CartState {
  logistic: LogisticData;
  sumShoppingCart: number;
}

const initialState: CartState = {
  logistic: {
    id: draftIdCounter,
    status: "draft",
    items: [],
    isMock: true,
  },
  sumShoppingCart: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setData(state, { payload }: { payload: LogisticData }) {
      state.logistic = payload;
    },
    addTruck(state, { payload }: { payload: number }) {
      const truck = TRUCKS_MOCK.results.find((t) => t.id === payload);
      if (!truck) {
        return;
      }

      const existing = state.logistic.items.find((item) => item.truckId === payload);

      if (existing) {
        existing.count = (existing.count ?? 0) + 1;
      } else {
        const newItem: LogisticItemData = {
          id: logisticItemCounter++,
          logisticId: state.logistic.id,
          truckId: payload,
          count: 1,
          price: truck.price ?? null,
          comment: "",
          truck: { ...truck },
        };
        state.logistic.items.push(newItem);
      }

      // Обновляем сумму корзины
      state.sumShoppingCart = state.logistic.items.reduce((sum, item) => {
        const price = item.price ?? item.truck.price ?? 0;
        return sum + price * (item.count ?? 1);
      }, 0);
    },
    removeTruck(state, { payload }: { payload: number }) {
      state.logistic.items = state.logistic.items.filter((item) => item.truckId !== payload);
      
      // Обновляем сумму корзины
      state.sumShoppingCart = state.logistic.items.reduce((sum, item) => {
        const price = item.price ?? item.truck.price ?? 0;
        return sum + price * (item.count ?? 1);
      }, 0);
    },
    updateItem(
      state,
      {
        payload,
      }: {
        payload: {
          truckId: number;
          updater: Partial<Pick<LogisticItemData, "price" | "comment" | "count">>;
        };
      }
    ) {
      const item = state.logistic.items.find((entry) => entry.truckId === payload.truckId);
      if (item) {
        if (typeof payload.updater.price === "number") item.price = payload.updater.price;
        if (typeof payload.updater.count === "number") item.count = payload.updater.count;
        if (typeof payload.updater.comment === "string") item.comment = payload.updater.comment;
      }

      // Обновляем сумму корзины
      state.sumShoppingCart = state.logistic.items.reduce((sum, item) => {
        const price = item.price ?? item.truck.price ?? 0;
        return sum + price * (item.count ?? 1);
      }, 0);
    },
    reset(state) {
      draftIdCounter += 1;
      logisticItemCounter = 1;
      state.logistic = {
        id: draftIdCounter,
        status: "draft",
        items: [],
        isMock: true,
      };
      state.sumShoppingCart = 0;
    },
    setSum(state, { payload }: { payload: number }) {
      state.sumShoppingCart += payload;
    },
    delSum(state) {
      state.sumShoppingCart = 0;
    },
  },
});

// Хуки для получения данных из store
export const useCart = () => useSelector((state: RootState) => state.cart.logistic);
export const useSum = () => useSelector((state: RootState) => state.cart.sumShoppingCart);
export const useCartItems = () => useSelector((state: RootState) => state.cart.logistic.items);

// Экспортируем actions
export const {
  setData: setDataAction,
  addTruck: addTruckAction,
  removeTruck: removeTruckAction,
  updateItem: updateItemAction,
  reset: resetAction,
  setSum: setSumAction,
  delSum: delSumAction,
} = cartSlice.actions;

export default cartSlice.reducer;

