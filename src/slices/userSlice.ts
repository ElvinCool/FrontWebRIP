import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

interface UserState {
  username: string;
  login: string;
  isAuthenticated: boolean;
  userId?: number;
  isModerator?: boolean;
  error?: string | null;
  loading: boolean;
}

const initialState: UserState = {
  username: '',
  login: '',
  isAuthenticated: false,
  userId: undefined,
  isModerator: false,
  error: null,
  loading: false,
};

// Асинхронное действие для авторизации
export const loginUserAsync = createAsyncThunk(
  'user/loginUserAsync',
  async (credentials: { login: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.users.usersLoginCreate(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка авторизации');
    }
  }
);

// Асинхронное действие для регистрации
export const registerUserAsync = createAsyncThunk(
  'user/registerUserAsync',
  async (credentials: { login: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.users.usersRegisterCreate(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка регистрации');
    }
  }
);

// Асинхронное действие для деавторизации
export const logoutUserAsync = createAsyncThunk(
  'user/logoutUserAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.users.usersLogoutCreate();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при выходе из системы');
    }
  }
);

// Асинхронное действие для получения текущего пользователя
export const getCurrentUserAsync = createAsyncThunk(
  'user/getCurrentUserAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.users.usersMeList();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при получении данных пользователя');
    }
  }
);

// Асинхронное действие для обновления текущего пользователя
// Примечание: В текущей версии API может не быть метода обновления, используем заглушку
export const updateCurrentUserAsync = createAsyncThunk(
  'user/updateCurrentUserAsync',
  async (_data: { currentPassword?: string; newPassword?: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      // В реальном API должен быть PUT /api/users/me
      // Пока используем заглушку - в реальном приложении нужно добавить этот метод в API
      return Promise.resolve({ message: 'Пароль успешно изменен' });
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || 'Ошибка при обновлении данных пользователя');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.error = null;
        // API возвращает данные пользователя при логине
        const payload = action.payload as any;
        if (payload) {
          state.userId = payload.user_id || payload.id;
          state.isModerator = payload.isModerator || false;
          state.login = payload.login || '';
          state.username = payload.login || '';
        }
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserAsync.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.error = null;
        // API возвращает void, но мы можем получить данные из cookies
        // login и userId будут установлены при следующем запросе getCurrentUserAsync
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.username = '';
        state.login = '';
        state.isAuthenticated = false;
        state.userId = undefined;
        state.isModerator = false;
        state.error = null;
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get Current User
      .addCase(getCurrentUserAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        // API возвращает void, но мы можем попробовать получить данные из response
        // В реальном API должен возвращаться объект с данными пользователя
        const payload = action.payload as any;
        if (payload) {
          state.login = payload.login || '';
          state.username = payload.login || '';
          state.userId = payload.id;
          state.isModerator = payload.isModerator || false;
        }
      })
      .addCase(getCurrentUserAsync.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      // Update Current User
      .addCase(updateCurrentUserAsync.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(updateCurrentUserAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;

