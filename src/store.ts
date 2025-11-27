import { combineReducers, configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import userReducer from "./slices/userSlice";
import logisticsReducer from "./slices/logisticsSlice";

const store = configureStore({
  reducer: combineReducers({
    cart: cartReducer,
    user: userReducer,
    logistics: logisticsReducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

