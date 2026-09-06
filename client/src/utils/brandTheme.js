const BRAND_STORAGE_KEY = 'edu.brandColor'
const WALLPAPER_STORAGE_KEY = 'edu.wallpaper'

export const DEFAULT_BRAND_COLOR = '#1F7EC2'

export const BRAND_COLOR_PRESETS = [
  '#1F7EC2',
  '#0D9488',
  '#2563EB',
  '#7C3AED',
  '#C2410C',
  '#BE123C',
  '#0F766E',
  '#334155'
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const normalizeHex = (value) => {
  if (!value || typeof value !== 'string') return null
  let hex = value.trim()
  if (!hex.startsWith('#')) hex = `#${hex}`
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null
  return hex.toUpperCase()
}

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex)
  if (!normalized) return { r: 31, g: 126, b: 194 }
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16)
  }
}

const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`

export const mixHex = (hex, targetHex, amount) => {
  const from = hexToRgb(hex)
  const to = hexToRgb(targetHex)
  const t = clamp(amount, 0, 1)
  return rgbToHex(
    from.r + (to.r - from.r) * t,
    from.g + (to.g - from.g) * t,
    from.b + (to.b - from.b) * t
  )
}

export const darkenHex = (hex, amount = 0.25) => mixHex(hex, '#000000', amount)

export const lightenHex = (hex, amount = 0.2) => mixHex(hex, '#FFFFFF', amount)

export const getBrandPalette = (brandColor = DEFAULT_BRAND_COLOR) => {
  const main = normalizeHex(brandColor) || DEFAULT_BRAND_COLOR
  return {
    main,
    light: lightenHex(main, 0.28),
    dark: darkenHex(main, 0.28),
    deeper: darkenHex(main, 0.55)
  }
}

export const getBrandGradient = (brandColor = DEFAULT_BRAND_COLOR) => {
  const { main, dark, deeper } = getBrandPalette(brandColor)
  return `linear-gradient(135deg, ${main} 0%, ${dark} 55%, ${deeper} 100%)`
}

export const readStoredBrandColor = () => {
  try {
    return normalizeHex(localStorage.getItem(BRAND_STORAGE_KEY)) || DEFAULT_BRAND_COLOR
  } catch {
    return DEFAULT_BRAND_COLOR
  }
}

export const storeBrandColor = (color) => {
  const normalized = normalizeHex(color)
  if (!normalized) return
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, normalized)
  } catch {
    // ignore quota / private mode
  }
}

export const readStoredWallpaper = (fallback) => {
  try {
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || fallback
  } catch {
    return fallback
  }
}

export const storeWallpaper = (path) => {
  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, path)
  } catch {
    // ignore
  }
}
