import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const PrivateRoute = ({ children, requiredRole }) => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole === ADMIN_ROLE && user.role !== ADMIN_ROLE) {
    return <Navigate to="/dashboard" />
  }

  if (requiredRole === STUDENT_ROLE && user.role !== STUDENT_ROLE) {
    return <Navigate to="/admin/dashboard" />
  }

  return children
}

export default PrivateRoute 