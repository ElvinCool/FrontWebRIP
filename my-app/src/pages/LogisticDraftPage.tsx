import "./LogisticDraftPage.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { Button, Form, Spinner } from "react-bootstrap";
import { fetchDraftLogistic, removeTruckFromCart, deleteDraftLogistic } from "../modules/trucksApi";
import type { LogisticData, LogisticItemData } from "../modules/logisticTypes";
import defaultImage from "../assets/DefaultImage.png";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../Routes";

interface CalculationState {
  weight: number;
  distance: number;
}

const defaultCalculationState = (item: LogisticItemData): CalculationState => ({
  weight: item.truck.weight ?? 1000,
  distance: 250,
});

const LogisticDraftPage = () => {
  const [logistic, setLogistic] = useState<LogisticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calculations, setCalculations] = useState<Record<number, CalculationState>>({});
  const [inputValues, setInputValues] = useState<Record<number, CalculationState>>({});
  const navigate = useNavigate();

  const loadLogistic = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDraftLogistic();
      setLogistic(data);
      if (data) {
        const map: Record<number, CalculationState> = {};
        const inputMap: Record<number, CalculationState> = {};
        data.items.forEach((item) => {
          const defaultState = defaultCalculationState(item);
          map[item.truckId] = defaultState;
          inputMap[item.truckId] = defaultState;
        });
        setCalculations(map);
        setInputValues(inputMap);
      } else {
        setCalculations({});
        setInputValues({});
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogistic();
  }, [loadLogistic]);

  const computedItems = useMemo(() => {
    if (!logistic) return [] as Array<{ item: LogisticItemData; calc: CalculationState; truckCount: number; totalCost: number; pricePerKm: number; }>;

    return logistic.items.map((item) => {
      const calc = calculations[item.truckId] ?? defaultCalculationState(item);
      const weightValue = calc.weight ?? 0;
      const distanceValue = calc.distance ?? 0;
      const capacity = item.truck.weight ?? 0;
      const baseCount = item.count ?? 1;
      const trucksByWeight = capacity > 0 ? Math.ceil(weightValue / capacity) : 1;
      const truckCount = Math.max(baseCount, trucksByWeight || 1);
      const pricePerKm = item.price ?? item.truck.price ?? 0;
      const totalCost = pricePerKm * distanceValue * truckCount;

      return {
        item,
        calc,
        truckCount,
        totalCost,
        pricePerKm,
      };
    });
  }, [logistic, calculations]);

  const totalSummary = useMemo(() => {
    return computedItems.reduce(
      (acc, entry) => {
        return {
          amount: acc.amount + entry.totalCost,
          trucks: acc.trucks + entry.truckCount,
        };
      },
      { amount: 0, trucks: 0 }
    );
  }, [computedItems]);

  const handleChange = (truckId: number, field: keyof CalculationState, value: number) => {
    setInputValues((prev) => ({
      ...prev,
      [truckId]: {
        ...(prev[truckId] ?? { weight: 0, distance: 0 }),
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleCalculate = (truckId: number) => {
    const inputState = inputValues[truckId];
    if (inputState) {
      setCalculations((prev) => ({
        ...prev,
        [truckId]: { ...inputState },
      }));
    }
  };

  const handleRemoveTruck = async (item: LogisticItemData) => {
    if (!logistic) return;
    await removeTruckFromCart(logistic.id, item.truckId);
    await loadLogistic();
  };

  const handleReset = async () => {
    if (logistic) {
      await deleteDraftLogistic(logistic.id);
      await loadLogistic();
    }
  };

  const handleBackToList = () => {
    navigate(ROUTES.ALBUMS);
  };

  return (
    <div className="logistic-page">
      <Header />

      <div className="logistic-container">
        <div className="logistic-header">
          <Button variant="link" className="logistic-back" onClick={handleBackToList}>
            ← Вернуться к списку грузовиков
          </Button>
          <h1 className="logistic-title">
            {logistic ? `Заявка на логистику № ${logistic.id}` : "Черновая заявка"}
          </h1>
          <p className="logistic-subtitle">Управляйте своими операциями по логистике</p>
        </div>

        {loading && (
          <div className="logistic-loader">
            <Spinner animation="border" />
          </div>
        )}

        {error && !loading && <div className="logistic-error">{error}</div>}

        {!loading && logistic && (
          <div className="logistic-content">
            <div className="logistic-main">
              {computedItems.length === 0 && (
                <div className="logistic-empty">
                  Ваша корзина пуста. Добавьте грузовики из каталога.
                </div>
              )}

              {computedItems.length > 0 && (
                <div className="logistic-items">
                  {computedItems.map(({ item, calc, truckCount, totalCost, pricePerKm }) => {
                    const inputState = inputValues[item.truckId] ?? calc;
                    const weightInputValue = inputState.weight ?? 0;
                    const distanceInputValue = inputState.distance ?? 0;
                    const image = item.truck.imgURL && item.truck.imgURL.length > 0 ? item.truck.imgURL : defaultImage;

                    return (
                      <div key={item.truckId} className="logistic-row">
                        <div className="logistic-row-image">
                          <img src={image} alt={item.truck.title} />
                        </div>
                        <div className="logistic-row-info">
                          <div className="logistic-row-title">{item.truck.title}</div>
                          <div className="logistic-row-meta">
                            {`Габариты: ${item.truck.length ?? "—"}×${item.truck.width ?? "—"}×${item.truck.height ?? "—"}м • Г/П: ${item.truck.weight ?? "—"}кг • Цена: ${pricePerKm.toLocaleString("ru-RU")} ₽/км`}
                          </div>
                        </div>
                        <div className="logistic-row-inputs">
                          <div className="logistic-input-group">
                            <Form.Label>Вес</Form.Label>
                            <Form.Control
                              type="number"
                              value={weightInputValue}
                              min={0}
                              onChange={(event) => handleChange(item.truckId, "weight", parseFloat(event.target.value))}
                            />
                          </div>
                          <div className="logistic-input-group">
                            <Form.Label>Км</Form.Label>
                            <Form.Control
                              type="number"
                              value={distanceInputValue}
                              min={0}
                              onChange={(event) => handleChange(item.truckId, "distance", parseFloat(event.target.value))}
                            />
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCalculate(item.truckId)}
                            className="logistic-calculate-btn"
                          >
                            Рассчитать
                          </Button>
                        </div>
                        <div className="logistic-row-summary">
                          <div className="logistic-row-summary-line">Машин: {truckCount}</div>
                          <div className="logistic-row-summary-line">
                            Итого: {totalCost.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveTruck(item)}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="logistic-summary-card">
              <div className="logistic-summary-title">Итоги заявки</div>
              <div className="logistic-summary-item">
                <span>Статус</span>
                <strong>{logistic.status ?? "draft"}</strong>
              </div>
              <div className="logistic-summary-item">
                <span>Количество машин</span>
                <strong>{totalSummary.trucks}</strong>
              </div>
              <div className="logistic-summary-item">
                <span>Итоговая стоимость</span>
                <strong>{totalSummary.amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽</strong>
              </div>

              <Button variant="outline-danger" onClick={handleReset} className="logistic-summary-delete">
                Удалить заявку
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticDraftPage;
