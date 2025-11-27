import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';
import type { LogisticData } from '../modules/logisticTypes';
import { normalizeLogistic } from '../modules/trucksApi';

interface LogisticsState {
  currentLogistic: LogisticData | null;
  logisticsList: LogisticData[];
  loading: boolean;
  error: string | null;
  isDraft: boolean;
  draftCount: number; // Количество грузовиков в черновике (service_count)
}

const initialState: LogisticsState = {
  currentLogistic: null,
  logisticsList: [],
  loading: false,
  error: null,
  isDraft: false,
  draftCount: 0,
};

// Получение черновика заявки
export const getDraftLogisticAsync = createAsyncThunk(
  'logistics/getDraftLogisticAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.logistic.logisticDraftList();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при загрузке черновика');
    }
  }
);

// Получение заявки по ID
export const getLogisticByIdAsync = createAsyncThunk(
  'logistics/getLogisticByIdAsync',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.logistics.logisticsDetail({ id });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при загрузке заявки');
    }
  }
);

// Получение списка заявок
export const getLogisticsListAsync = createAsyncThunk(
  'logistics/getLogisticsListAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.logistics.logisticsList();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при загрузке списка заявок');
    }
  }
);

// Добавление грузовика в черновик
export const addTruckToDraftAsync = createAsyncThunk(
  'logistics/addTruckToDraftAsync',
  async (truckId: number, { rejectWithValue, dispatch }) => {
    try {
      console.log('addTruckToDraftAsync: отправка запроса для truckId:', truckId);
      const response = await api.logistics.logisticsDraftAddCreate({ id: truckId });
      console.log('addTruckToDraftAsync: получен ответ:', response);
      // После добавления обновляем черновик
      await dispatch(getDraftLogisticAsync());
      return response.data;
    } catch (error: any) {
      console.error('addTruckToDraftAsync: ошибка:', error);
      console.error('addTruckToDraftAsync: детали ошибки:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      const errorMessage = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.message 
        || 'Ошибка при добавлении грузовика';
      return rejectWithValue(errorMessage);
    }
  }
);

// Удаление заявки
export const deleteLogisticAsync = createAsyncThunk(
  'logistics/deleteLogisticAsync',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.logistics.logisticsDelete({ id });
      return { id, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при удалении заявки');
    }
  }
);

// Обновление заявки (для модератора)
export const updateLogisticAsync = createAsyncThunk(
  'logistics/updateLogisticAsync',
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.logistics.logisticsUpdate({ id }, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при обновлении заявки');
    }
  }
);

// Удаление грузовика из заявки
export const removeTruckFromLogisticAsync = createAsyncThunk(
  'logistics/removeTruckFromLogisticAsync',
  async ({ logisticId, truckId }: { logisticId: number; truckId: number }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.logisticTruck.logisticTruckDelete({ logisticId, truckId });
      // Обновляем текущую заявку
      await dispatch(getLogisticByIdAsync(logisticId));
      return { logisticId, truckId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при удалении грузовика');
    }
  }
);

// Обновление количества грузовика в заявке
export const updateLogisticTruckAsync = createAsyncThunk(
  'logistics/updateLogisticTruckAsync',
  async ({ logisticId, truckId, count }: { logisticId: number; truckId: number; count: number }, { rejectWithValue, dispatch }) => {
    try {
      // API принимает body как второй параметр
      await api.logisticTruck.logisticTruckUpdate({ logisticId, truckId }, { count } as any);
      // Обновляем текущую заявку
      await dispatch(getLogisticByIdAsync(logisticId));
      return { logisticId, truckId, count };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при обновлении количества');
    }
  }
);

// Сохранение заявки пользователем (статус -> "сформирован")
export const saveLogisticAsync = createAsyncThunk(
  'logistics/saveLogisticAsync',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.logistics.logisticsSaveUpdate({ id });
      // Обновляем текущую заявку после сохранения
      await dispatch(getLogisticByIdAsync(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при сохранении заявки');
    }
  }
);

// Завершение заявки модератором (статус -> "завершен")
export const finalizeLogisticAsync = createAsyncThunk(
  'logistics/finalizeLogisticAsync',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.logistics.logisticsFinalizeUpdate({ id });
      // Обновляем список заявок после завершения
      await dispatch(getLogisticsListAsync());
      return { id, data: response.data };
    } catch (error: any) {
      console.error('Ошибка при завершении заявки:', error);
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Ошибка при завершении заявки');
    }
  }
);

// Отклонение заявки модератором (статус -> "отклонен")
export const rejectLogisticAsync = createAsyncThunk(
  'logistics/rejectLogisticAsync',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      // API принимает status как query параметр через URL
      // В сгенерированном API query параметры передаются через ...query в первом параметре
      // Но нужно передать их через params.query во втором параметре
      const response = await api.logistics.logisticsCloseUpdate(
        { id },
        {
          params: {
            query: { status: 'rejected' }
          }
        } as any
      );
      // Обновляем список заявок после отклонения
      await dispatch(getLogisticsListAsync());
      return { id, data: response.data };
    } catch (error: any) {
      console.error('Ошибка при отклонении заявки:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Ошибка при отклонении заявки';
      return rejectWithValue(errorMessage);
    }
  }
);

const logisticsSlice = createSlice({
  name: 'logistics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentLogistic: (state) => {
      state.currentLogistic = null;
      state.isDraft = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Draft
      .addCase(getDraftLogisticAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDraftLogisticAsync.fulfilled, (state, action) => {
        state.loading = false;
        // API возвращает {id, service_count}
        const payload = action.payload as any;
        if (payload) {
          // Сохраняем количество грузовиков в черновике
          state.draftCount = payload.service_count || payload.serviceCount || 0;
          
          // Если есть полные данные заявки, сохраняем их
          if (payload.items || payload.trucks || payload.logistic_trucks) {
            state.currentLogistic = {
              id: payload.id || payload.ID || 0,
              status: payload.status || 'draft',
              items: payload.items || payload.trucks || payload.logistic_trucks || [],
              isMock: false,
            };
            state.isDraft = (payload.status === 'draft' || payload.status === 1);
          } else if (payload.id) {
            // Если есть только ID, нужно загрузить полные данные
            // Это будет сделано в LogisticDraftPage через getLogisticByIdAsync
            state.currentLogistic = null;
          }
        }
      })
      .addCase(getDraftLogisticAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get By Id
      .addCase(getLogisticByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLogisticByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        // API возвращает полные данные заявки
        const payload = action.payload as any;
        if (payload) {
          // Используем функцию нормализации из trucksApi
          const normalized = normalizeLogistic(payload);
          if (normalized) {
            state.currentLogistic = normalized;
            state.isDraft = (normalized.status === 'черновик' || normalized.status === 'draft' || normalized.status === '1' || String(normalized.status) === '1');
          } else {
            // Fallback если нормализация не удалась
            state.currentLogistic = {
              id: payload.id || payload.ID || 0,
              status: payload.status || 'draft',
              items: payload.logistic_trucks || payload.items || payload.trucks || [],
              isMock: false,
            };
            state.isDraft = (payload.status === 'черновик' || payload.status === 'draft' || payload.status === 1);
          }
        }
      })
      .addCase(getLogisticByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get List
      .addCase(getLogisticsListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLogisticsListAsync.fulfilled, (state, action) => {
        state.loading = false;
        // API возвращает массив заявок
        const payload = action.payload as any;
        if (payload) {
          // Нормализуем каждую заявку
          const logistics = Array.isArray(payload) ? payload : (payload.logistics || []);
          state.logisticsList = logistics.map((log: any) => {
            // Нормализуем данные заявки
            const normalized = normalizeLogistic(log);
            if (normalized) {
              return {
                ...normalized,
                creator: log.creator || log.Creator,
                moderator: log.moderator || log.Moderator,
                date_create: log.date_create || log.dateCreate,
                date_update: log.date_update || log.dateUpdate,
                date_finish: log.date_finish || log.dateFinish,
              };
            }
            return {
              id: log.id || log.ID || 0,
              status: log.status || 'draft',
              items: log.logistic_trucks || log.items || [],
              isMock: false,
              creator: log.creator || log.Creator,
              moderator: log.moderator || log.Moderator,
            };
          });
        }
      })
      .addCase(getLogisticsListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Truck
      .addCase(addTruckToDraftAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTruckToDraftAsync.fulfilled, (state) => {
        state.loading = false;
        // После добавления грузовика увеличиваем счетчик
        // (getDraftLogisticAsync обновит точное значение)
        state.draftCount += 1;
      })
      .addCase(addTruckToDraftAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Logistic
      .addCase(deleteLogisticAsync.fulfilled, (state, action) => {
        state.logisticsList = state.logisticsList.filter(log => log.id !== action.payload.id);
        if (state.currentLogistic?.id === action.payload.id) {
          state.currentLogistic = null;
          state.isDraft = false;
        }
      })
      // Remove Truck
      .addCase(removeTruckFromLogisticAsync.fulfilled, (state, action) => {
        if (state.currentLogistic) {
          state.currentLogistic.items = state.currentLogistic.items.filter(
            item => item.truckId !== action.payload.truckId
          );
        }
      })
      // Save Logistic
      .addCase(saveLogisticAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveLogisticAsync.fulfilled, (state) => {
        state.loading = false;
        if (state.currentLogistic) {
          state.currentLogistic.status = 'сформирован';
          state.isDraft = false;
        }
      })
      .addCase(saveLogisticAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentLogistic } = logisticsSlice.actions;
export default logisticsSlice.reducer;

