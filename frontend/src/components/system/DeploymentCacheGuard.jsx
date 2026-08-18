import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const APP_VERSION_KEY = 'app_build_version'

/**
 * Detects a new frontend deployment via /version.json (cache-busted fetch).
 * When the build id changes, clears React Query cache and reloads once.
 */
const DeploymentCacheGuard = () => {
  const queryClient = useQueryClient()
  const checkingRef = useRef(false)

  useEffect(() => {
    const checkVersion = async () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache'
          }
        })

        if (!response.ok) return

        const data = await response.json()
        const remoteVersion = data?.version
        if (!remoteVersion) return

        const localVersion = localStorage.getItem(APP_VERSION_KEY)

        if (!localVersion) {
          localStorage.setItem(APP_VERSION_KEY, remoteVersion)
          return
        }

        if (localVersion !== remoteVersion) {
          localStorage.setItem(APP_VERSION_KEY, remoteVersion)
          try {
            await queryClient.cancelQueries()
            queryClient.clear()
          } catch (error) {
            console.error('Error clearing query cache on deploy:', error)
          }
          // Force a full reload so students get the new JS bundle + fresh data
          window.location.reload()
        }
      } catch (error) {
        // Ignore network errors (offline / version file missing in some hosts)
        console.warn('Deployment version check skipped:', error?.message || error)
      } finally {
        checkingRef.current = false
      }
    }

    checkVersion()

    const onFocus = () => checkVersion()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    const intervalId = window.setInterval(checkVersion, 5 * 60 * 1000)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(intervalId)
    }
  }, [queryClient])

  return null
}

export default DeploymentCacheGuard
