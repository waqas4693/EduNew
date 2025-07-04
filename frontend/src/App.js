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
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'

import InactiveStudents from './components/students/InactiveStudents'
import StudentCourses from './components/students/StudentCourses'
import CourseStudents from './components/courses/CourseStudents'
import AssessmentReview from './components/assessment/AssessmentReview'
import GradedAssessments from './components/assessment/GradedAssessments'
import ResourceAnalytics from './components/admin/ResourceAnalytics'
import StudentAssessments from './components/assessment/StudentAssessments'
import CreateUser from './components/users/CreateUser'
import BulkUpload from './components/files/BulkUpload'
import StudentProfile from './components/students/StudentProfile'

import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import SplashScreen from './components/splash/SplashScreen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create Redux store
const store = configureStore({
  reducer: {
    course: courseReducer
  }
})

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <MuiThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <CssBaseline />
                  <Routes>
                    <Route path="/" element={<SplashScreen />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/verify-email" element={<EmailVerification />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    {/* Admin & Assessment Roles Routes */}
                    <Route
                      path="/admin/*"
                      element={
                        <PrivateRoute requiredRole={[1, 3, 4, 5]}>
                          <DashboardLayout>
                            <Routes>
                              {/* Admin only routes */}
                              <Route 
                                path="/dashboard" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <AdminDashboard />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/add-course" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <AddCourse />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/invite-student" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <InviteStudent />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/inactive-courses" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <InactiveCourses />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/active-students" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <ActiveStudents />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/inactive-students" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <InactiveStudents />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/create-user" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <CreateUser />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/bulk-upload" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <BulkUpload />
                                  </PrivateRoute>
                                } 
                              />

                              {/* Shared routes for Admin & Assessment roles */}
                              <Route path="/assessment-review" element={<AssessmentReview />} />
                              <Route path="/assessment-review/submitted" element={<AssessmentReview />} />
                              <Route path="/assessment-review/graded" element={<GradedAssessments />} />
                              <Route path="/profile" element={<Profile />} />

                              {/* Admin only routes continued */}
                              <Route 
                                path="/resource-analytics" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <ResourceAnalytics />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/students/:studentId/profile" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <StudentProfile />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/students/:id/courses" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <StudentCourses />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/courses/:id/students" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <CourseStudents />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/students/:id/courses/:courseId/progress" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <StudentProgress />
                                  </PrivateRoute>
                                } 
                              />
                              <Route 
                                path="/students/:studentId/assessments" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <StudentAssessments isAdminView={true} />
                                  </PrivateRoute>
                                } 
                              />
                            </Routes>
                          </DashboardLayout>
                        </PrivateRoute>
                      }
                    />

                    {/* Student Routes */}
                    <Route
                      path="/*"
                      element={
                        <PrivateRoute requiredRole={[2]}>
                          <DashboardLayout>
                            <Routes>
                              <Route path="/dashboard" element={<StudentDashboard />} />
                              <Route path="/units/:courseId" element={<Units />} />
                              <Route path="/units/:courseId/section/:unitId" element={<Section />} />
                              <Route path="/units/:courseId/section/:unitId/learn/:sectionId" element={<LearnerFrame />} />
                              <Route path="/units/:courseId/section/:unitId/assessment/:sectionId" element={<ViewAssessment />} />
                              <Route path="/assessment" element={<StudentAssessments />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/students/:studentId/courses/:courseId/progress" element={<StudentProgress />} />
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
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  )
}

export default App
