import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentCourse: null,
  currentUnit: null,
  loading: false,
  error: null
}

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setCurrentCourse: (state, action) => {
      state.currentCourse = action.payload
    },
    setCurrentUnit: (state, action) => {
      state.currentUnit = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  }
})

export const { setCurrentCourse, setCurrentUnit, setLoading, setError } =
  courseSlice.actions
export default courseSlice.reducer
