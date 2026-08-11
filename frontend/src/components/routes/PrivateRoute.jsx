import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const PrivateRoute = ({ children, requiredRole }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole != null) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!allowedRoles.includes(user.role)) {
      if (user.role === STUDENT_ROLE) {
        return <Navigate to="/dashboard" />
      }
      if (user.role === ADMIN_ROLE) {
        return <Navigate to="/admin/dashboard" />
      }
      return <Navigate to="/admin/assessment-review" />
    }
  }

  return children
}

export default PrivateRoute
