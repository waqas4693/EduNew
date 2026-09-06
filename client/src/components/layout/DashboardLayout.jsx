import { useCallback, useState } from 'react'
import {
  Box,
  useMediaQuery,
  useTheme,
  Dialog,
  Typography,
  TextField,
  Tabs,
  Tab
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import Sidebar from './Sidebar'
import Calendar from '../calendar/Calendar'
import {
  LayoutChromeProvider,
  LayoutChromeNavButtons,
  LayoutChromePaletteButton,
  usePageChromeState,
  useActionsSlot,
  useLayoutChromeValue
} from './LayoutChrome'
import { useAppTheme } from '../../context/ThemeContext'
import { BRAND_COLOR_PRESETS, normalizeHex } from '../../utils/brandTheme'
import { LAYOUT_HEADER_HEIGHT } from './layoutConstants'

const backgroundImages = ['1.jpg', '2.jpg', '3.jpg', '4.jpg']

const DashboardLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { brandColor, brandGradient, setBrandColor, background, setBackground } = useAppTheme()
  const { pageChrome, setPageChrome } = usePageChromeState()
  const { setActionsSlotEl, getActionsSlot } = useActionsSlot()

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [openDialog, setOpenDialog] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [appearanceTab, setAppearanceTab] = useState(0)
  const [customColor, setCustomColor] = useState(brandColor)

  const handleImageSelect = useCallback(
    (image) => {
      setBackground(`/background-images/${image}`)
      setOpenDialog(false)
    },
    [setBackground]
  )

  const applyBrandColor = useCallback(
    (color) => {
      const normalized = normalizeHex(color)
      if (!normalized) return
      setBrandColor(normalized)
      setCustomColor(normalized)
    },
    [setBrandColor]
  )

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open)
  }, [])

  const openPalette = useCallback(() => {
    setCustomColor(brandColor)
    setOpenDialog(true)
  }, [brandColor])

  const openCalendar = useCallback(() => {
    setCalendarOpen(true)
  }, [])

  const chromeValue = useLayoutChromeValue({
    toggleSidebar,
    openPalette,
    openCalendar,
    isMobile,
    setPageChrome,
    getActionsSlot
  })

  return (
    <LayoutChromeProvider value={chromeValue}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen
            })
          }}
        >
          <Box
            component="header"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: (muiTheme) => muiTheme.zIndex.appBar,
              height: LAYOUT_HEADER_HEIGHT,
              minHeight: LAYOUT_HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              px: { xs: 1.5, md: 2.5 },
              py: 0,
              color: '#fff',
              background: brandGradient,
              boxShadow: '0 8px 24px rgba(10, 37, 64, 0.18)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
              <LayoutChromeNavButtons light />
              <Box sx={{ minWidth: 0 }}>
                {pageChrome?.kicker && (
                  <Typography
                    sx={{
                      fontFamily: '"Source Sans 3", sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: 0.82,
                      lineHeight: 1.15
                    }}
                  >
                    {pageChrome.kicker}
                  </Typography>
                )}
                {pageChrome?.title ? (
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces", serif',
                      fontWeight: 600,
                      fontSize: { xs: '1.05rem', md: '1.2rem' },
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {pageChrome.title}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces", serif',
                      fontWeight: 600,
                      fontSize: { xs: '1.05rem', md: '1.2rem' },
                      lineHeight: 1.2
                    }}
                  >
                    EduSupplements
                  </Typography>
                )}
                {pageChrome?.subtitle && (
                  <Typography
                    sx={{
                      mt: 0.1,
                      fontSize: 12,
                      opacity: 0.88,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {pageChrome.subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
                ml: 'auto'
              }}
            >
              <Box
                ref={setActionsSlotEl}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}
              />
              <LayoutChromePaletteButton light />
            </Box>
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 3 },
              width: '100%',
              minHeight: 0,
              backgroundImage: background ? `url(${background})` : 'none',
              backgroundColor: 'transparent',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '14px', p: 3 }
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
            fontSize: '1.25rem',
            color: 'secondary.dark',
            mb: 1
          }}
        >
          Appearance
        </Typography>

        <Tabs
          value={appearanceTab}
          onChange={(_, value) => setAppearanceTab(value)}
          sx={{ mb: 2, minHeight: 40 }}
        >
          <Tab label="Brand color" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab label="Background" sx={{ textTransform: 'none', minHeight: 40 }} />
        </Tabs>

        {appearanceTab === 0 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              This color fills the sidebar and becomes a gradient in the sticky header.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 2 }}>
              {BRAND_COLOR_PRESETS.map((preset) => {
                const selected = normalizeHex(brandColor) === normalizeHex(preset)
                return (
                  <Box
                    key={preset}
                    onClick={() => applyBrandColor(preset)}
                    role="button"
                    aria-label={`Use brand color ${preset}`}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: preset,
                      cursor: 'pointer',
                      border: selected ? '3px solid' : '3px solid transparent',
                      borderColor: selected ? 'secondary.dark' : 'transparent',
                      boxShadow: selected
                        ? '0 0 0 2px rgba(10, 37, 64, 0.15)'
                        : '0 4px 12px rgba(10, 37, 64, 0.12)',
                      '&:hover': { transform: 'translateY(-1px)' }
                    }}
                  />
                )
              })}
            </Box>

            <Box
              sx={{
                mb: 2,
                height: 56,
                borderRadius: '10px',
                background: brandGradient,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)'
              }}
            />

            <TextField
              fullWidth
              size="small"
              type="color"
              label="Custom color"
              value={normalizeHex(customColor) || brandColor}
              onChange={(event) => {
                const next = event.target.value
                setCustomColor(next)
                applyBrandColor(next)
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {backgroundImages.map((image) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={image}>
                <Box
                  component="img"
                  src={`/background-images/${image}`}
                  alt={`Background option ${image.replace(/\.[^.]+$/, '')}`}
                  onClick={() => handleImageSelect(image)}
                  sx={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: background.endsWith(image)
                      ? '3px solid'
                      : '3px solid transparent',
                    borderColor: background.endsWith(image) ? 'primary.main' : 'transparent',
                    '&:hover': {
                      opacity: 0.92
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Dialog>

      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <Calendar />
      </Dialog>
    </LayoutChromeProvider>
  )
}

export default DashboardLayout
