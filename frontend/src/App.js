import Login from './components/auth/Login'
import Profile from './components/profile/Profile'
import CssBaseline from '@mui/material/CssBaseline'
import AddCourse from './components/forms/AddCourse'
import Units from './components/app-components/Units'
import courseReducer from './redux/slices/courseSlice'
import Section from './components/app-components/Section'
import PrivateRoute from './components/routes/PrivateRoute'
import InviteStudent from './components/forms/InviteStudent'
import ActiveStudents from './components/students/ActiveStudents'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminDashboard from './components/dashboard/AdminDashboard'
import InactiveCourses from './components/courses/InactiveCourses'
import StudentProgress from './components/students/StudentProgress'
import LearnerFrame from './components/app-components/LearnerFrame'
import StudentDashboard from './components/dashboard/StudentDashboard'
import ViewAssessment from './components/app-components/ViewAssessment'

import InactiveStudents from './components/students/InactiveStudents'
import StudentCourses from './components/students/StudentCourses'
import CourseStudents from './components/courses/CourseStudents'
import AssessmentReview from './components/assessment/AssessmentReview'
import GradedAssessments from './components/assessment/GradedAssessments'
import ResourceAnalytics from './components/admin/ResourceAnalytics'
import StudentAssessments from './components/assessment/StudentAssessments'

import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import SplashScreen from './components/splash/SplashScreen'

// Create Redux store
const store = configureStore({
  reducer: {
    course: courseReducer
  }
})

// MUI theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#3366CC'
    },
    secondary: {
      main: '#dc004e'
    }
  }
})

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <MuiThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<SplashScreen />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <PrivateRoute requiredRole={1}>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<AdminDashboard />} />
                            <Route path="/add-course" element={<AddCourse />} />
                            <Route path="/invite-student" element={<InviteStudent />} />
                            <Route path="/inactive-courses" element={<InactiveCourses />} />
                            <Route path="/active-students" element={<ActiveStudents />} />
                            <Route path="/inactive-students" element={<InactiveStudents />} />
                            <Route path="/students/:id/courses" element={<StudentCourses />} />
                            <Route path="/courses/:id/students" element={<CourseStudents />} />
                            <Route path="/assessment-review" element={<AssessmentReview />} />
                            <Route path="/assessment-review/submitted" element={<AssessmentReview />} />
                            <Route path="/assessment-review/graded" element={<GradedAssessments />} />
                            <Route path="/resource-analytics" element={<ResourceAnalytics />} />
                            <Route path="/students/:id/courses/:courseId/progress" element={<StudentProgress />} />
                            <Route 
                              path="/students/:studentId/assessments" 
                              element={<StudentAssessments isAdminView={true} />} 
                            />
                            <Route path="/profile" element={<Profile />} />
                          </Routes>
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />

                  {/* Student Routes */}
                  <Route
                    path="/*"
                    element={
                      <PrivateRoute requiredRole={2}>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<StudentDashboard />} />
                            <Route path="/units/:courseId" element={<Units />} />
                            <Route path="/units/:courseId/section/:unitId" element={<Section />} />
                            <Route path="/units/:courseId/section/:unitId/learn/:sectionId" element={<LearnerFrame />} />
                            <Route path="/units/:courseId/section/:unitId/assessment/:sectionId" element={<ViewAssessment />} />
                            <Route path="/assessment" element={<StudentAssessments />} />
                            <Route path="/profile" element={<Profile />} />
                          </Routes>
                        </DashboardLayout>
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </LocalizationProvider>
            </MuiThemeProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default App
