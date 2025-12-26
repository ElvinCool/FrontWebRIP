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
  length?: number;
  width?: number;
  height?: number;
}

const defaultCalculationState = (item: LogisticItemData): CalculationState => ({
  // Вес груза по умолчанию 0, а не грузоподъемность грузовика
  // Грузоподъемность - это характеристика грузовика, а не вес груза
  weight: 0,
  // Используем count из item (который содержит Distance из БД), если он есть и > 0
  // Иначе используем значение по умолчанию 250
  distance: (item.count && item.count > 0) ? item.count : 250,
  length: item.truck.length ?? undefined,
  width: item.truck.width ?? undefined,
  height: item.truck.height ?? undefined,
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
  const [initialBudget, setInitialBudget] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);

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

  // Вычисляем остаточный бюджет
  useEffect(() => {
    if (initialBudget > 0) {
      setRemainingBudget(initialBudget - totalSummary.amount);
    } else {
      setRemainingBudget(null);
    }
  }, [initialBudget, totalSummary.amount]);

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
      // Подготавливаем данные для обновления Distance (километры) и CountLogistics (количество машин)
      // ВАЖНО: используем inputValues, а не calculations, потому что inputValues содержит то, что ввел пользователь
      const logisticTrucks: Array<{ truck_id: number; distance: number; count_logistics?: number }> = [];
      
      if (logistic.items && logistic.items.length > 0) {
        logistic.items.forEach((item) => {
          // Используем inputValues - это то, что пользователь ввел в поля
          const inputState = inputValues[item.truckId];
          const distance = inputState?.distance ?? 0;
          const weight = inputState?.weight ?? 0;
          
          // Вычисляем количество машин на основе веса груза
          const capacity = item.truck.weight ?? 0;
          const trucksByWeight = capacity > 0 ? Math.ceil(weight / capacity) : 1;
          const countLogistics = Math.max(1, trucksByWeight);
          
          console.log(`Saving for truck ${item.truckId}: weight=${weight}, distance=${distance}, count_logistics=${countLogistics}`);
          
          // Если distance > 0, добавляем в список для обновления
          if (distance > 0) {
            logisticTrucks.push({
              truck_id: item.truckId,
              distance: distance, // Сохраняем distance (километры)
              count_logistics: countLogistics, // Сохраняем количество машин
            });
          }
        });
      }
      
      console.log('Saving logistic with updates:', logisticTrucks);
      
      // Сохраняем заявку с обновлением Distance и CountLogistics
      await dispatch(saveLogisticAsync({ 
        id: logistic.id, 
        logisticTrucks: logisticTrucks.length > 0 ? logisticTrucks : undefined 
      })).unwrap();
      
      // Ждем немного, чтобы данные успели обновиться на бэкенде
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // После сохранения переходим к списку заявок
      navigate(ROUTES.LOGISTICS_LIST);
    } catch (error) {
      console.error("Ошибка при сохранении заявки:", error);
      alert("Ошибка при сохранении заявки. Проверьте консоль для деталей.");
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
          <div className="logistic-title-section">
            <h1 className="logistic-title">
              {logistic ? `Заявка на логистику № ${logistic.id}` : "Черновая заявка"}
            </h1>
            {isDraft && (
              <span className="logistic-draft-badge">черновик</span>
            )}
          </div>
        </div>

        {logistic && (
          <>
            {/* Секция с полями ввода (аналог начального/остаточного заряда) */}
            {isDraft && (
              <div className="logistic-inputs-section">
                <div className="logistic-inputs-row">
                  <div className="logistic-input-field">
                    <Form.Label>Начальный бюджет (₽)</Form.Label>
                    <Form.Control
                      type="number"
                      value={initialBudget}
                      min={0}
                      onChange={(event) => setInitialBudget(parseFloat(event.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="logistic-input-field">
                    <Form.Label>Остаток бюджета (₽)</Form.Label>
                    <Form.Control
                      type="text"
                      value={remainingBudget !== null ? remainingBudget.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) : "—"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div className="logistic-actions-row">
                  <Button variant="primary" onClick={handleSave} disabled={!logistic || logistic.items.length === 0}>
                    Сохранить изменения
                  </Button>
                  <Button variant="success" onClick={handleSave} disabled={!logistic || logistic.items.length === 0}>
                    Сформировать заявку
                  </Button>
                  <Button variant="danger" onClick={handleReset}>
                    Удалить заявку
                  </Button>
                </div>
              </div>
            )}

            {/* Секция со сценариями (грузовиками) */}
            <div className="logistic-scenarios-section">
              <h2 className="logistic-scenarios-title">Грузовики в заявке</h2>
              
              {computedItems.length === 0 && (
                <div className="logistic-empty">
                  Ваша корзина пуста. Добавьте грузовики из каталога.
                </div>
              )}

              {computedItems.length > 0 && (
                <div className="logistic-scenarios-list">
                  {computedItems.map(({ item, calc, truckCount, totalCost, pricePerKm }) => {
                    const inputState = inputValues[item.truckId] ?? calc;
                    const weightInputValue = inputState.weight ?? 0;
                    const distanceInputValue = inputState.distance ?? 0;
                    const image = item.truck.imgURL && item.truck.imgURL.length > 0 ? item.truck.imgURL : defaultImage;

                    return (
                      <div key={item.truckId} className="logistic-scenario-card">
                        <div className="scenario-card-image">
                          <img src={image} alt={item.truck.title} />
                        </div>
                        <div className="scenario-card-content">
                          <h3 className="scenario-card-title">{item.truck.title}</h3>
                          <div className="scenario-card-params">
                            <div className="scenario-param">
                              <Form.Label>Вес груза (кг)</Form.Label>
                              <Form.Control
                                type="number"
                                value={weightInputValue}
                                min={0}
                                onChange={(event) => handleChange(item.truckId, "weight", parseFloat(event.target.value))}
                                disabled={!isDraft}
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Расстояние (км)</Form.Label>
                              <Form.Control
                                type="number"
                                value={distanceInputValue}
                                min={0}
                                onChange={(event) => handleChange(item.truckId, "distance", parseFloat(event.target.value))}
                                disabled={!isDraft}
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Длина (м)</Form.Label>
                              <Form.Control
                                type="text"
                                value={item.truck.length ? item.truck.length.toLocaleString("ru-RU") : "—"}
                                disabled
                                readOnly
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Ширина (м)</Form.Label>
                              <Form.Control
                                type="text"
                                value={item.truck.width ? item.truck.width.toLocaleString("ru-RU") : "—"}
                                disabled
                                readOnly
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Высота (м)</Form.Label>
                              <Form.Control
                                type="text"
                                value={item.truck.height ? item.truck.height.toLocaleString("ru-RU") : "—"}
                                disabled
                                readOnly
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Гр/П (кг)</Form.Label>
                              <Form.Control
                                type="text"
                                value={item.truck.weight ? item.truck.weight.toLocaleString("ru-RU") : "—"}
                                disabled
                                readOnly
                              />
                            </div>
                            <div className="scenario-param">
                              <Form.Label>Цена за км (₽)</Form.Label>
                              <Form.Control
                                type="text"
                                value={pricePerKm.toLocaleString("ru-RU")}
                                disabled
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="scenario-card-actions">
                            {isDraft && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleCalculate(item.truckId)}
                                >
                                  Сохранить
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveTruck(item)}
                                >
                                  Удалить
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="scenario-card-summary">
                          <div className="scenario-summary-line">Машин: {truckCount}</div>
                          <div className="scenario-summary-line">
                            Итого: {totalCost.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogisticDraftPage;
