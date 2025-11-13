import { TRUCKS_MOCK } from "./mock";
import type { LogisticData, LogisticItemData } from "./logisticTypes";

let draftIdCounter = 1000;
let logisticItemCounter = 1;

let draftLogistic: LogisticData = {
  id: draftIdCounter,
  status: "draft",
  items: [],
  isMock: true,
};

const cloneLogistic = (): LogisticData => ({
  id: draftLogistic.id,
  status: draftLogistic.status,
  isMock: true,
  items: draftLogistic.items.map((item) => ({
    ...item,
    truck: { ...item.truck },
  })),
});

export const cartMockStore = {
  addTruck(truckId: number): LogisticData {
    const truck = TRUCKS_MOCK.results.find((t) => t.id === truckId);
    if (!truck) {
      return cloneLogistic();
    }

    const existing = draftLogistic.items.find((item) => item.truckId === truckId);

    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
    } else {
      const newItem: LogisticItemData = {
        id: logisticItemCounter++,
        logisticId: draftLogistic.id,
        truckId,
        count: 1,
        price: truck.price ?? null,
        comment: "",
        truck: { ...truck },
      };
      draftLogistic.items.push(newItem);
    }

    return cloneLogistic();
  },

  getDraft(): LogisticData {
    return cloneLogistic();
  },

  removeTruck(truckId: number): LogisticData {
    draftLogistic.items = draftLogistic.items.filter((item) => item.truckId !== truckId);
    return cloneLogistic();
  },

  reset(): LogisticData {
    draftIdCounter += 1;
    logisticItemCounter = 1;
    draftLogistic = {
      id: draftIdCounter,
      status: "draft",
      items: [],
      isMock: true,
    };
    return cloneLogistic();
  },

  updateItem(truckId: number, updater: Partial<Pick<LogisticItemData, "price" | "comment" | "count">>): LogisticData {
    const item = draftLogistic.items.find((entry) => entry.truckId === truckId);
    if (item) {
      if (typeof updater.price === "number") item.price = updater.price;
      if (typeof updater.count === "number") item.count = updater.count;
      if (typeof updater.comment === "string") item.comment = updater.comment;
    }
    return cloneLogistic();
  },
};
