import { createContext, useContext, useEffect } from 'react'
import { Box, IconButton } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PaletteIcon from '@mui/icons-material/Palette'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

const LayoutChromeContext = createContext(null)

export const LayoutChromeProvider = LayoutChromeContext.Provider

export const useLayoutChrome = () => useContext(LayoutChromeContext)

export const useClaimLayoutChrome = () => {
  const chrome = useLayoutChrome()

  useEffect(() => {
    if (!chrome?.setOwnsChrome) return undefined
    chrome.setOwnsChrome(true)
    return () => chrome.setOwnsChrome(false)
  }, [chrome])
}

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

/** Background picker — extreme right of the header */
export const LayoutChromePaletteButton = ({ light = false }) => {
  const chrome = useLayoutChrome()
  if (!chrome) return null

  return (
    <IconButton
      onClick={chrome.openPalette}
      aria-label="Change background"
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
