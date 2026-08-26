import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getData } from '../api/api'

const AuthContext = createContext(null)

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

const syncEnrollmentDates = (courseIds = []) => {
  const enrollmentDates = {}
  courseIds.forEach(({ courseId, enrollmentDate }) => {
    if (courseId) {
      enrollmentDates[String(courseId)] = enrollmentDate
    }
  })
  localStorage.setItem('enrollmentDates', JSON.stringify(enrollmentDates))
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)

        if (window.location.pathname === '/login') {
          switch (userData.role) {
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
      if (userData.role === STUDENT_ROLE && userData.courseIds) {
        syncEnrollmentDates(userData.courseIds)
      }

      const userWithDemo = {
        ...userData,
        isDemo: userData.isDemo || false
      }

      // Drop any previous session query cache so a new login never shows stale courses
      queryClient.clear()

      setUser(userWithDemo)
      localStorage.setItem('user', JSON.stringify(userWithDemo))
      localStorage.setItem('token', token)
    } catch (error) {
      console.error('Error saving user data:', error)
    }
  }

  const logout = () => {
    setUser(null)
    queryClient.clear()
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    if (localStorage.getItem('enrollmentDates')) {
      localStorage.removeItem('enrollmentDates')
    }
    navigate('/login')
  }

  /**
   * Re-fetch active course enrollments from the database and update local session.
   * Fixes "new course assigned but old device still shows old list".
   */
  const refreshStudentSession = useCallback(async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (!token || !storedUser) return null

    let currentUser
    try {
      currentUser = JSON.parse(storedUser)
    } catch {
      return null
    }

    if (currentUser.role !== STUDENT_ROLE || !currentUser.studentId) {
      return currentUser
    }

    try {
      const response = await getData(`student/${currentUser.studentId}`)
      const student = response.data?.data
      if (!student) return currentUser

      const courseIds = (student.courses || [])
        .filter((course) => course.courseStatus === 1 && course.courseId)
        .map((course) => ({
          courseId: course.courseId?._id || course.courseId,
          enrollmentDate: course.enrollmentDate
        }))

      const updatedUser = {
        ...currentUser,
        name: student.name || currentUser.name,
        contactNo: student.contactNo || currentUser.contactNo,
        address: student.address || currentUser.address,
        isDemo: student.isDemo || false,
        courseIds
      }

      const previous = JSON.stringify(currentUser.courseIds || [])
      const next = JSON.stringify(courseIds)

      syncEnrollmentDates(courseIds)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      if (previous !== next) {
        queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] })
        queryClient.invalidateQueries({ queryKey: ['assessmentDueDates'] })
        queryClient.invalidateQueries({ queryKey: ['allAssessmentDueDates'] })
      }

      return updatedUser
    } catch (error) {
      console.error('Error refreshing student session:', error)
      return currentUser
    }
  }, [queryClient])

  if (loading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshStudentSession }}>
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
