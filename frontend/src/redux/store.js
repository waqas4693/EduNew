import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage
import courseReducer from './slices/courseSlice'

const persistConfig = {
  key: 'root',
  storage,
  // You can blacklist specific reducers you don't want to persist
  // blacklist: ['someReducer']
}

const persistedReducer = persistReducer(persistConfig, courseReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export const persistor = persistStore(store) 