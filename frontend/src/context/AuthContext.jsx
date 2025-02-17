import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        
        if (window.location.pathname === '/login') {
          switch(userData.role) {
            case ADMIN_ROLE:
              navigate('/admin/dashboard')
              break
            case STUDENT_ROLE:
              navigate('/dashboard')
              break
            case ASSESSOR_ROLE:
            case MODERATOR_ROLE:
            case VERIFIER_ROLE:
              navigate('/admin/assessment-review/submitted')
              break
            default:
              break
          }
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const login = (userData, token) => {
    try {
      console.log('Storing user data:', userData)
      
      // Only store enrollment dates for students
      if (userData.role === STUDENT_ROLE && userData.courseIds) {
        const enrollmentDates = {}
        userData.courseIds.forEach(({ courseId, enrollmentDate }) => {
          enrollmentDates[courseId] = enrollmentDate
        })
        localStorage.setItem('enrollmentDates', JSON.stringify(enrollmentDates))
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', token)
    } catch (error) {
      console.error('Error saving user data:', error)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Only remove enrollment dates if they exist
    if (localStorage.getItem('enrollmentDates')) {
      localStorage.removeItem('enrollmentDates')
    }
    navigate('/login')
  }

  if (loading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 