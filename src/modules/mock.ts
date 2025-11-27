import type { TrucksResult } from "./getTruckById";
import truck1 from "../assets/truck1.png";
import truck2 from "../assets/truck2.png";
import truck3 from "../assets/truck3.png";

export const TRUCKS_MOCK: TrucksResult = {
  resultCount: 6,
  results: [
    {
      id: 1,
      title: "Mercedes Sprinter LCV",
      preview: "Компактный фургон для городской доставки",
      imgURL: truck1,
      description:
        "Идеален для быстрой доставки малых партий грузов по городу и области. Маневренный, удобен для адресных перевозок и подъезда во дворы.",
      weight: 1200,
      price: 2600,
      length: 6.9,
      width: 2.4,
      height: 2.8,
      year: 2022,
      status: "available",
    },
    {
      id: 2,
      title: "MAN TGL",
      preview: "Среднетоннажный грузовик для региональных маршрутов",
      imgURL: truck2,
      description:
        "MAN TGL сочетает в себе маневренность и высокий запас мощности. Подходит для перевозки стройматериалов, мебели и паллет.",
      weight: 6000,
      price: 4500,
      length: 7.3,
      width: 2.5,
      height: 3.2,
      year: 2021,
      status: "available",
    },
    {
      id: 3,
      title: "Volvo FL 12t",
      preview: "Крупный грузовик для дальних перевозок",
      imgURL: truck3,
      description:
        "Volvo FL 12t предназначен для транспортировки длинномерных и тяжёлых грузов. Отличается высокой грузоподъёмностью и вместительным кузовом.",
      weight: 12000,
      price: 500,
      length: 8.2,
      width: 2.5,
      height: 3.6,
      year: 2020,
      status: "available",
    },
    {
      id: 4,
      title: "Mercedes Sprinter LCV XL",
      preview: "Удлинённый вариант для объемных поставок",
      imgURL: truck1,
      description:
        "Удлинённый Sprinter XL идеально подходит для доставки мебели и крупной бытовой техники. Повышенный объём кузова и усиленная подвеска.",
      weight: 1600,
      price: 3100,
      length: 7.8,
      width: 2.4,
      height: 3.0,
      year: 2021,
      status: "available",
    },
    {
      id: 5,
      title: "MAN TGL City",
      preview: "Городской грузовик с экономичным расходом",
      imgURL: truck2,
      description:
        "Создан для частых остановок и работы в узких городских пространствах. Автоматическая коробка передач и обзорная кабина.",
      weight: 5500,
      price: 4200,
      length: 7.0,
      width: 2.4,
      height: 3.0,
      year: 2019,
      status: "maintenance",
    },
    {
      id: 6,
      title: "Volvo FL Container",
      preview: "Профессиональный грузовик для контейнеров",
      imgURL: truck3,
      description:
        "Volvo FL Container обеспечивает быструю и безопасную перевозку контейнеров. Усиленная рама и автоматизированные системы погрузки.",
      weight: 14000,
      price: 6200,
      length: 8.8,
      width: 2.6,
      height: 3.8,
      year: 2023,
      status: "available",
    },
  ],
};
