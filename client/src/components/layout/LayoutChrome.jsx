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

export const LayoutChromeButtons = ({ light = false }) => {
  const chrome = useLayoutChrome()
  if (!chrome) return null

  const color = light ? '#fff' : 'secondary.dark'

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={chrome.toggleSidebar}
        aria-label="Open menu"
        sx={{ color }}
      >
        <MenuIcon />
      </IconButton>
      {chrome.isMobile && (
        <IconButton
          onClick={chrome.openCalendar}
          aria-label="Open calendar"
          sx={{ color }}
        >
          <CalendarTodayIcon />
        </IconButton>
      )}
      <IconButton
        onClick={chrome.openPalette}
        aria-label="Change background"
        sx={{ color }}
      >
        <PaletteIcon />
      </IconButton>
    </Box>
  )
}
