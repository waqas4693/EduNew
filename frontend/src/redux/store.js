import { configureStore } from '@reduxjs/toolkit'
import courseReducer from './slices/courseSlice'

const store = configureStore({
  reducer: {
    course: courseReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
})

export default store 