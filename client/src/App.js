import Login from './components/auth/Login'
import Profile from './components/profile/Profile'
import CssBaseline from '@mui/material/CssBaseline'
import CreateCourse from './components/course-builder/CreateCourse'
import CourseBuilder from './components/course-builder/CourseBuilder'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import SplashScreen from './components/splash/SplashScreen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import DeploymentCacheGuard from './components/system/DeploymentCacheGuard'
import StudentSessionRefresh from './components/system/StudentSessionRefresh'

// Create Redux store
const store = configureStore({
  reducer: {
    course: courseReducer
  }
})

// Create React Query client — prefer fresh server data over long-lived cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      retry: 1,
      staleTime: 0,
    },
  },
})

// MUI theme — aligned with Splash / Login brand
const theme = createTheme({
  palette: {
    primary: {
      main: '#1F7EC2',
      dark: '#155A8F',
      light: '#4A9AD4',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#12304A',
      dark: '#0A2540',
      light: '#2A4A66',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F5F8FB',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#0A2540',
      secondary: 'rgba(10, 37, 64, 0.68)'
    }
  },
  typography: {
    fontFamily: '"Source Sans 3", sans-serif',
    h1: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h2: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h3: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h5: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h6: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: {
    borderRadius: 10
  }
})

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <DeploymentCacheGuard />
            <StudentSessionRefresh />
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
                                path="/courses/new" 
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <CreateCourse />
                                  </PrivateRoute>
                                } 
                              />
                              <Route
                                path="/courses/:courseId/builder"
                                element={<Navigate to="overview" replace />}
                              />
                              <Route
                                path="/courses/:courseId/builder/:tab"
                                element={
                                  <PrivateRoute requiredRole={[1]}>
                                    <CourseBuilder />
                                  </PrivateRoute>
                                }
                              />
                              <Route
                                path="/add-course"
                                element={<Navigate to="/admin/courses/new" replace />}
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
