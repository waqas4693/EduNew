import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import { Box, IconButton } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PaletteIcon from '@mui/icons-material/Palette'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

const LayoutChromeContext = createContext(null)

export const LayoutChromeProvider = ({ value, children }) => (
  <LayoutChromeContext.Provider value={value}>{children}</LayoutChromeContext.Provider>
)

export const useLayoutChrome = () => useContext(LayoutChromeContext)

/**
 * Registers page title into the sticky layout header.
 * Actions are portaled into the header actions slot.
 */
export const usePageChrome = ({ kicker, title, subtitle, actions } = {}) => {
  const chrome = useLayoutChrome()
  const setPageChrome = chrome?.setPageChrome
  const slotEl = chrome?.getActionsSlot?.() || null

  useLayoutEffect(() => {
    if (!setPageChrome) return
    setPageChrome({
      kicker: kicker || '',
      title: title || '',
      subtitle: subtitle || ''
    })
  }, [setPageChrome, kicker, title, subtitle])

  useEffect(() => {
    if (!setPageChrome) return undefined
    return () => setPageChrome(null)
  }, [setPageChrome])

  if (!slotEl || !actions) return null

  try {
    return createPortal(actions, slotEl)
  } catch {
    return null
  }
}

/** Drop-in component form of usePageChrome for pages that don't use PageShell */
export const PageChrome = ({ kicker, title, subtitle, actions }) =>
  usePageChrome({ kicker, title, subtitle, actions })

/** @deprecated Header chrome is always layout-owned now */
export const useClaimLayoutChrome = () => {}

const iconSx = (light) => ({ color: light ? '#fff' : 'secondary.dark' })

export const LayoutChromeNavButtons = ({ light = false }) => {
  const chrome = useLayoutChrome()
  if (!chrome) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={chrome.toggleSidebar}
        aria-label="Open menu"
        sx={iconSx(light)}
      >
        <MenuIcon />
      </IconButton>
      {chrome.isMobile && (
        <IconButton
          onClick={chrome.openCalendar}
          aria-label="Open calendar"
          sx={iconSx(light)}
        >
          <CalendarTodayIcon />
        </IconButton>
      )}
    </Box>
  )
}

export const LayoutChromePaletteButton = ({ light = false }) => {
  const chrome = useLayoutChrome()
  if (!chrome) return null

  return (
    <IconButton
      onClick={chrome.openPalette}
      aria-label="Change appearance"
      sx={iconSx(light)}
    >
      <PaletteIcon />
    </IconButton>
  )
}

export const LayoutChromeButtons = ({ light = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <LayoutChromeNavButtons light={light} />
    <LayoutChromePaletteButton light={light} />
  </Box>
)

export const usePageChromeState = () => {
  const [pageChrome, setPageChromeState] = useState(null)

  const setPageChrome = useCallback((next) => {
    setPageChromeState((prev) => {
      if (!next) return null
      if (
        prev &&
        prev.kicker === next.kicker &&
        prev.title === next.title &&
        prev.subtitle === next.subtitle
      ) {
        return prev
      }
      return {
        kicker: next.kicker || '',
        title: next.title || '',
        subtitle: next.subtitle || ''
      }
    })
  }, [])

  return { pageChrome, setPageChrome }
}

/** Stable actions-slot bridge: ref for portal target + tick when it mounts */
export const useActionsSlot = () => {
  const actionsSlotRef = useRef(null)
  const [slotVersion, setSlotVersion] = useState(0)

  const setActionsSlotEl = useCallback((node) => {
    if (actionsSlotRef.current === node) return
    actionsSlotRef.current = node
    setSlotVersion((version) => version + 1)
  }, [])

  const getActionsSlot = useCallback(() => actionsSlotRef.current, [slotVersion])

  return { setActionsSlotEl, getActionsSlot, slotVersion }
}

export const useLayoutChromeValue = ({
  toggleSidebar,
  openPalette,
  openCalendar,
  isMobile,
  setPageChrome,
  getActionsSlot
}) =>
  useMemo(
    () => ({
      toggleSidebar,
      openPalette,
      openCalendar,
      isMobile,
      setPageChrome,
      getActionsSlot
    }),
    [toggleSidebar, openPalette, openCalendar, isMobile, setPageChrome, getActionsSlot]
  )
