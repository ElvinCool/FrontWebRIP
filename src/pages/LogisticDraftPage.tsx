import "./LogisticDraftPage.css";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import Header from "../components/Header";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import { 
  getDraftLogisticAsync, 
  getLogisticByIdAsync,
  removeTruckFromLogisticAsync,
  deleteLogisticAsync,
  saveLogisticAsync,
  updateLogisticTruckAsync,
  clearError,
} from "../slices/logisticsSlice";
import { useCart, removeTruckAction, resetAction } from "../slices/cartSlice";
import { removeTruckFromCart, deleteDraftLogistic } from "../modules/trucksApi";
import type { LogisticItemData } from "../modules/logisticTypes";
import defaultImage from "../assets/DefaultImage.png";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../Routes";

interface CalculationState {
  weight: number;
  distance: number;
}

const defaultCalculationState = (item: LogisticItemData): CalculationState => ({
  weight: item.truck.weight ?? 1000,
  // Используем count из item (который содержит Distance из БД), если он есть и > 0
  // Иначе используем значение по умолчанию 250
  distance: (item.count && item.count > 0) ? item.count : 250,
});

const LogisticDraftPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  // Redux state
  const { currentLogistic, loading, error, isDraft } = useSelector((state: RootState) => state.logistics);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  
  // Fallback to cart for guests
  const cartLogistic = useCart();
  const logistic = currentLogistic || cartLogistic;
  
  const [calculations, setCalculations] = useState<Record<number, CalculationState>>({});
  const [inputValues, setInputValues] = useState<Record<number, CalculationState>>({});

  // Load logistic data
  useEffect(() => {
    if (!isAuthenticated) {
      // For guests, use cart
      return;
    }
    
    if (id) {
      // Load specific logistic by ID
      dispatch(getLogisticByIdAsync(parseInt(id)));
    } else {
      // Load draft - сначала получаем ID, потом загружаем полные данные
      dispatch(getDraftLogisticAsync()).then((result) => {
        if (result.type === 'logistics/getDraftLogisticAsync/fulfilled') {
          const payload = result.payload as any;
          const draftId = payload?.id || payload?.ID;
          if (draftId) {
            // Загружаем полные данные заявки по ID
            dispatch(getLogisticByIdAsync(draftId));
          }
        }
      });
    }
  }, [dispatch, id, isAuthenticated]);

  // Автоматическое обновление данных для завершенных заявок, если цены еще не рассчитаны
  useEffect(() => {
    if (!id || !logistic || !isAuthenticated) return;
    
    // Проверяем, завершена ли заявка и есть ли незаполненные цены
    const statusStr = String(logistic.status || '').toLowerCase();
    const isCompleted = statusStr === 'завершен' || statusStr === 'completed' || statusStr === 'closed';
    
    if (isCompleted && logistic.items && logistic.items.length > 0) {
      // Проверяем, есть ли элементы с ценой = 0 или null
      const hasUncalculatedPrices = logistic.items.some(
        (item) => !item.price || item.price === 0
      );
      
      if (hasUncalculatedPrices) {
        // Обновляем данные каждые 3 секунды, пока цены не будут рассчитаны
        // Максимум 20 попыток (1 минута)
        let attempts = 0;
        const maxAttempts = 20;
        
        const intervalId = setInterval(() => {
          attempts++;
          if (attempts > maxAttempts) {
            console.log('Stopped auto-refreshing: max attempts reached');
            clearInterval(intervalId);
            return;
          }
          
          console.log(`Auto-refreshing logistic data (attempt ${attempts}/${maxAttempts})...`);
          dispatch(getLogisticByIdAsync(parseInt(id)));
        }, 3000);
        
        // Очищаем интервал при размонтировании
        return () => {
          clearInterval(intervalId);
        };
      }
    }
  }, [dispatch, id, logistic, isAuthenticated]);

  useEffect(() => {
    if (logistic && logistic.items && logistic.items.length > 0) {
      const map: Record<number, CalculationState> = {};
      const inputMap: Record<number, CalculationState> = {};
      logistic.items.forEach((item) => {
        // Используем значение из БД (item.count содержит CountLogistics)
        // Если count > 0, используем его, иначе значение по умолчанию
        const defaultState = defaultCalculationState(item);
        console.log(`Initializing state for truck ${item.truckId}: count=${item.count}, distance=${defaultState.distance}`);
        map[item.truckId] = defaultState;
        inputMap[item.truckId] = defaultState;
      });
      setCalculations(map);
      setInputValues(inputMap);
    } else {
      setCalculations({});
      setInputValues({});
    }
  }, [logistic]);
  
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const computedItems = useMemo(() => {
    if (!logistic) return [] as Array<{ item: LogisticItemData; calc: CalculationState; truckCount: number; totalCost: number; pricePerKm: number; }>;

    return logistic.items.map((item) => {
      const calc = calculations[item.truckId] ?? defaultCalculationState(item);
      const weightValue = calc.weight ?? 0;
      const distanceValue = calc.distance ?? 0;
      const capacity = item.truck.weight ?? 0;
      // Используем countLogistics (количество машин) из БД, если есть, иначе вычисляем по весу
      const baseCount = item.countLogistics ?? 1;
      const trucksByWeight = capacity > 0 ? Math.ceil(weightValue / capacity) : 1;
      const truckCount = Math.max(baseCount, trucksByWeight || 1);
      // Используем рассчитанную цену из LogisticTruck, если она есть и > 0
      // Иначе используем цену грузовика за км
      const pricePerKm = (item.price && item.price > 0) ? item.price : (item.truck.price ?? 0);
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
    
    if (isAuthenticated && currentLogistic) {
      // Use Redux async thunk for authenticated users
      try {
        await dispatch(removeTruckFromLogisticAsync({ 
          logisticId: logistic.id, 
          truckId: item.truckId 
        })).unwrap();
      } catch (error) {
        console.error("Ошибка при удалении грузовика:", error);
      }
    } else {
      // Fallback for guests
      try {
        await removeTruckFromCart(logistic.id, item.truckId);
      } catch (error) {
        console.warn("Ошибка при удалении через API, используем Redux", error);
      }
      dispatch(removeTruckAction(item.truckId));
    }
  };

  // Функция для обновления количества грузовика (можно использовать в будущем)
  // const handleUpdateCount = async (truckId: number, newCount: number) => {
  //   if (!logistic || !isAuthenticated || !currentLogistic) return;
  //   
  //   try {
  //     await dispatch(updateLogisticTruckAsync({
  //       logisticId: logistic.id,
  //       truckId,
  //       count: newCount,
  //     })).unwrap();
  //   } catch (error) {
  //     console.error("Ошибка при обновлении количества:", error);
  //   }
  // };

  const handleReset = async () => {
    if (!logistic) return;
    
    if (isAuthenticated && currentLogistic) {
      // Use Redux async thunk for authenticated users
      try {
        await dispatch(deleteLogisticAsync(logistic.id)).unwrap();
        navigate(ROUTES.ALBUMS);
      } catch (error) {
        console.error("Ошибка при удалении заявки:", error);
      }
    } else {
      // Fallback for guests
      try {
        await deleteDraftLogistic(logistic.id);
      } catch (error) {
        console.warn("Ошибка при удалении через API, используем Redux", error);
      }
      dispatch(resetAction());
      navigate(ROUTES.ALBUMS);
    }
  };

  const handleSave = async () => {
    if (!logistic || !isAuthenticated || !currentLogistic) return;
    
    try {
      // Подготавливаем данные для обновления Distance (километры) из значений distance
      // ВАЖНО: используем inputValues, а не calculations, потому что inputValues содержит то, что ввел пользователь
      const logisticTrucks: Array<{ truck_id: number; distance: number }> = [];
      
      if (logistic.items && logistic.items.length > 0) {
        logistic.items.forEach((item) => {
          // Используем inputValues - это то, что пользователь ввел в поля
          const inputState = inputValues[item.truckId];
          const distance = inputState?.distance ?? 0;
          
          console.log(`Saving distance for truck ${item.truckId}: inputState=`, inputState, `distance=`, distance);
          
          // Если distance > 0, добавляем в список для обновления
          if (distance > 0) {
            logisticTrucks.push({
              truck_id: item.truckId,
              distance: distance, // Сохраняем distance (километры)
            });
          }
        });
      }
      
      console.log('Saving logistic with Distance:', logisticTrucks);
      
      // Сохраняем заявку с обновлением Distance
      await dispatch(saveLogisticAsync({ 
        id: logistic.id, 
        logisticTrucks: logisticTrucks.length > 0 ? logisticTrucks : undefined 
      })).unwrap();
      
      // После сохранения переходим к списку заявок
      navigate(ROUTES.LOGISTICS_LIST);
    } catch (error) {
      console.error("Ошибка при сохранении заявки:", error);
    }
  };

  const handleBackToList = () => {
    if (isAuthenticated) {
      navigate(ROUTES.LOGISTICS_LIST);
    } else {
      navigate(ROUTES.ALBUMS);
    }
  };
  
  if (loading) {
    return (
      <div className="logistic-page">
        <Header />
        <div className="logistic-container">
          <div className="logistic-loading">
            <Spinner animation="border" />
            <p>Загрузка заявки...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!logistic && !loading) {
    return (
      <div className="logistic-page">
        <Header />
        <div className="logistic-container">
          <Alert variant="info">Заявка не найдена</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="logistic-page">
      <Header />

      <div className="logistic-container">
        {error && <Alert variant="danger" className="logistic-error">{error}</Alert>}
        
        <div className="logistic-header">
          <Button variant="link" className="logistic-back" onClick={handleBackToList}>
            ← {isAuthenticated ? "Вернуться к списку заявок" : "Вернуться к списку грузовиков"}
          </Button>
          <h1 className="logistic-title">
            {logistic ? `Заявка на логистику № ${logistic.id}` : "Черновая заявка"}
          </h1>
          <p className="logistic-subtitle">
            {isDraft ? "Управляйте своими операциями по логистике" : "Просмотр заявки"}
          </p>
        </div>

        {logistic && (
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
                              disabled={!isDraft}
                            />
                          </div>
                          <div className="logistic-input-group">
                            <Form.Label>Км</Form.Label>
                            <Form.Control
                              type="number"
                              value={distanceInputValue}
                              min={0}
                              onChange={(event) => handleChange(item.truckId, "distance", parseFloat(event.target.value))}
                              disabled={!isDraft}
                            />
                          </div>
                          {isDraft && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleCalculate(item.truckId)}
                              className="logistic-calculate-btn"
                            >
                              Рассчитать
                            </Button>
                          )}
                        </div>
                        <div className="logistic-row-summary">
                          <div className="logistic-row-summary-line">Машин: {truckCount}</div>
                          <div className="logistic-row-summary-line">
                            Итого: {totalCost.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                          </div>
                          {isDraft && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveTruck(item)}
                            >
                              Удалить
                            </Button>
                          )}
                          {!isDraft && (
                            <div className="logistic-view-only">Только просмотр</div>
                          )}
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

              {isDraft && (
                <>
                  <Button variant="success" onClick={handleSave} className="logistic-summary-save" disabled={!logistic || logistic.items.length === 0}>
                    Сохранить заявку
                  </Button>
                  <Button variant="outline-danger" onClick={handleReset} className="logistic-summary-delete">
                    Удалить заявку
                  </Button>
                </>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticDraftPage;
