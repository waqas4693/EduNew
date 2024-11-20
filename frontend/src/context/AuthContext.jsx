import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

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
        
        // Redirect to appropriate dashboard if on login page
        if (window.location.pathname === '/login') {
          if (userData.role === ADMIN_ROLE) {
            navigate('/admin/dashboard')
          } else if (userData.role === STUDENT_ROLE) {
            navigate('/dashboard')
          }
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('user') // Clear invalid data
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const login = (userData) => {
    try {
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('Error saving user data:', error)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) {
    return null // or a loading spinner
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