import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../../context/AuthContext'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole != null) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!allowedRoles.includes(user.role)) {
      if (user.role === STUDENT_ROLE) {
        return <Navigate to="/dashboard" replace />
      }
      if (user.role === ADMIN_ROLE) {
        return <Navigate to="/admin/dashboard" replace />
      }
      return <Navigate to="/admin/assessment-review" replace />
    }
  }

  return children
}

export default PrivateRoute
