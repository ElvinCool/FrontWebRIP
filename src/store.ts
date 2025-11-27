import { combineReducers, configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";

const store = configureStore({
  reducer: combineReducers({
    cart: cartReducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export default store;

