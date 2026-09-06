import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_BRAND_COLOR,
  getBrandGradient,
  getBrandPalette,
  normalizeHex,
  readStoredBrandColor,
  readStoredWallpaper,
  storeBrandColor,
  storeWallpaper
} from '../utils/brandTheme'

const ThemeContext = createContext(null)

const DEFAULT_WALLPAPER = '/background-images/4.jpg'

export const ThemeProvider = ({ children }) => {
  const [brandColor, setBrandColorState] = useState(() => readStoredBrandColor())
  const [background, setBackgroundState] = useState(() =>
    readStoredWallpaper(DEFAULT_WALLPAPER)
  )

  const setBrandColor = useCallback((color) => {
    const normalized = normalizeHex(color)
    if (!normalized) return
    setBrandColorState(normalized)
    storeBrandColor(normalized)
  }, [])

  const setBackground = useCallback((path) => {
    if (!path) return
    setBackgroundState(path)
    storeWallpaper(path)
  }, [])

  const brandPalette = useMemo(() => getBrandPalette(brandColor), [brandColor])
  const brandGradient = useMemo(() => getBrandGradient(brandColor), [brandColor])

  const value = useMemo(
    () => ({
      brandColor: brandColor || DEFAULT_BRAND_COLOR,
      brandPalette,
      brandGradient,
      setBrandColor,
      background,
      setBackground
    }),
    [brandColor, brandPalette, brandGradient, setBrandColor, background, setBackground]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider')
  }
  return context
}