import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

/**
 * Keeps student course enrollment list fresh from the database.
 * Runs on mount, route changes, and when the tab becomes visible again.
 */
const StudentSessionRefresh = () => {
  const { user, refreshStudentSession } = useAuth()
  const location = useLocation()
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!user || user.role !== 2 || !refreshStudentSession) return

    const run = async () => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        await refreshStudentSession()
      } finally {
        inFlightRef.current = false
      }
    }

    run()

    const onFocus = () => run()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user?.studentId, user?.role, location.pathname, refreshStudentSession])

  return null
}

export default StudentSessionRefresh
