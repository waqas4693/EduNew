import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentCourse: null,
  currentUnit: null,
  loading: false,
  error: null,
  lastSectionInfo: {
    unitId: null,
    sectionId: null,
    isLastSection: false
  }
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
    },
    setLastSectionInfo: (state, action) => {
      state.lastSectionInfo = {
        unitId: action.payload.unitId,
        sectionId: action.payload.sectionId,
        isLastSection: action.payload.isLastSection
      }
    },
    clearLastSectionInfo: (state) => {
      state.lastSectionInfo = {
        unitId: null,
        sectionId: null,
        isLastSection: false
      }
    }
  }
})

export const { 
  setCurrentCourse, 
  setCurrentUnit, 
  setLoading, 
  setError,
  setLastSectionInfo,
  clearLastSectionInfo
} = courseSlice.actions
export default courseSlice.reducer
