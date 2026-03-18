import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import expenseReducer from './slices/expenseSlice'
import uiReducer from './slices/uiSlice'
import notificationReducer from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expenseReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})