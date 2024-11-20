import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminDashboard from './components/dashboard/AdminDashboard'
import StudentDashboard from './components/dashboard/StudentDashboard'
import PrivateRoute from './components/routes/PrivateRoute'
import Login from './components/auth/Login'
import AddCourse from './components/forms/AddCourse'
import AddUnit from './components/forms/AddUnit'
import AddSection from './components/forms/AddSection'
import AddResource from './components/forms/AddResource'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Units from './components/app-components/Units'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
})

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Routes>
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
                        <Route path="/add-unit" element={<AddUnit />} />
                        <Route path="/add-section" element={<AddSection />} />
                        <Route path="/add-resource" element={<AddResource />} />
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
                      </Routes>
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </MuiThemeProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
