import { Box, CircularProgress } from '@mui/material'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getData, registerUnauthorizedHandler } from '../api/api'

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

const clearStoredSession = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  if (localStorage.getItem('enrollmentDates')) {
    localStorage.removeItem('enrollmentDates')
  }
}

const redirectForRole = (role, navigate) => {
  switch (role) {
    case ADMIN_ROLE:
      navigate('/admin/dashboard', { replace: true })
      break
    case STUDENT_ROLE:
      navigate('/dashboard', { replace: true })
      break
    case ASSESSOR_ROLE:
    case MODERATOR_ROLE:
    case VERIFIER_ROLE:
      navigate('/admin/assessment-review/submitted', { replace: true })
      break
    default:
      break
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logout = useCallback((message) => {
    setUser(null)
    queryClient.clear()
    clearStoredSession()
    navigate('/login', {
      replace: true,
      state: message ? { message } : undefined
    })
  }, [navigate, queryClient])

  useEffect(() => {
    registerUnauthorizedHandler((message) => {
      logout(message || 'Session expired. Please log in again.')
    })
  }, [logout])

  useEffect(() => {
    const initializeSession = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        clearStoredSession()
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const response = await getData('auth/verify')
        const verifiedUser = response.data?.data?.user

        if (response.status !== 200 || !verifiedUser) {
          throw new Error('Invalid session')
        }

        if (verifiedUser.role === STUDENT_ROLE && verifiedUser.courseIds) {
          syncEnrollmentDates(verifiedUser.courseIds)
        }

        setUser(verifiedUser)
        localStorage.setItem('user', JSON.stringify(verifiedUser))

        if (window.location.pathname === '/login') {
          redirectForRole(verifiedUser.role, navigate)
        }
      } catch (error) {
        console.error('Session verification failed:', error)
        clearStoredSession()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeSession()
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

      queryClient.clear()
      setUser(userWithDemo)
      localStorage.setItem('user', JSON.stringify(userWithDemo))
      localStorage.setItem('token', token)
    } catch (error) {
      console.error('Error saving user data:', error)
    }
  }

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshStudentSession, authLoading: loading }}>
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
