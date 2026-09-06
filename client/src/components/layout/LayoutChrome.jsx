import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import { Box, IconButton } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PaletteIcon from '@mui/icons-material/Palette'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

const LayoutChromeContext = createContext(null)

export const LayoutChromeProvider = LayoutChromeContext.Provider

export const useLayoutChrome = () => useContext(LayoutChromeContext)

/**
 * Registers page title into the sticky layout header.
 * Actions are portaled into the header actions slot (avoids setState loops).
 */
export const usePageChrome = ({ kicker, title, subtitle, actions } = {}) => {
  const chrome = useLayoutChrome()

  useLayoutEffect(() => {
    if (!chrome?.setPageChrome) return
    chrome.setPageChrome({
      kicker: kicker || '',
      title: title || '',
      subtitle: subtitle || ''
    })
  }, [chrome, kicker, title, subtitle])

  useEffect(() => {
    if (!chrome?.setPageChrome) return undefined
    return () => chrome.setPageChrome(null)
  }, [chrome])

  if (!chrome?.actionsSlotEl || !actions) return null
  return createPortal(actions, chrome.actionsSlotEl)
}

/** Drop-in component form of usePageChrome for pages that don't use PageShell */
export const PageChrome = ({ kicker, title, subtitle, actions }) =>
  usePageChrome({ kicker, title, subtitle, actions })


/** @deprecated Header chrome is always layout-owned now */
export const useClaimLayoutChrome = () => {}

const iconSx = (light) => ({ color: light ? '#fff' : 'secondary.dark' })

/** Menu (+ calendar on mobile) — left side of the header */
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

/** Appearance picker — extreme right of the header */
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

/** @deprecated Prefer NavButtons + PaletteButton for left/right layout */
export const LayoutChromeButtons = ({ light = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <LayoutChromeNavButtons light={light} />
    <LayoutChromePaletteButton light={light} />
  </Box>
)

export const usePageChromeState = () => {
  const [pageChrome, setPageChromeState] = useState(null)

  const setPageChrome = (next) => {
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
  }

  return { pageChrome, setPageChrome }
}
