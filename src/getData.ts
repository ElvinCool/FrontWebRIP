import { useEffect } from "react";
import axios from "axios";
import { setDataAction } from "./slices/cartSlice";
import { useDispatch } from "react-redux";
import type { LogisticData } from "./modules/logisticTypes";

export function GetData() {
  const dispatch = useDispatch();

  async function fetchData() {
    try {
      // Получение данных с API (пример из методички)
      // В реальном проекте здесь будет ваш API endpoint
      await axios.get("https://fakestoreapi.com/products?limit=5");
      
      // Если нужно преобразовать данные в формат LogisticData
      // Здесь можно добавить логику преобразования
      
      // Для примера создадим пустую корзину
      const logisticData: LogisticData = {
        id: 1000,
        status: "draft",
        items: [],
        isMock: true,
      };
      
      dispatch(setDataAction(logisticData));
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      // В случае ошибки создаем пустую корзину
      const logisticData: LogisticData = {
        id: 1000,
        status: "draft",
        items: [],
        isMock: true,
      };
      dispatch(setDataAction(logisticData));
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
}

