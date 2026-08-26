import { useState } from 'react'
import { Box, useMediaQuery, useTheme, Dialog, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import Sidebar from './Sidebar'
import Calendar from '../calendar/Calendar'
import {
  LayoutChromeProvider,
  LayoutChromeNavButtons,
  LayoutChromePaletteButton
} from './LayoutChrome'

const backgroundImages = [
  '1.jpg',
  '2.jpg',
  '3.jpg',
  '4.jpg'
]

const DashboardLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [background, setBackground] = useState(`/background-images/${backgroundImages[3]}`)
  const [openDialog, setOpenDialog] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [ownsChrome, setOwnsChrome] = useState(false)

  const handleImageSelect = (image) => {
    setBackground(`/background-images/${image}`)
    setOpenDialog(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <LayoutChromeProvider
      value={{
        toggleSidebar,
        openPalette: () => setOpenDialog(true),
        openCalendar: () => setCalendarOpen(true),
        isMobile,
        setOwnsChrome
      }}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!ownsChrome && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 1,
                background:
                  'linear-gradient(135deg, #1F7EC2 0%, #155A8F 55%, #0A2540 100%)'
              }}
            >
              <LayoutChromeNavButtons light />
              <LayoutChromePaletteButton light />
            </Box>
          )}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, md: 3 },
              width: '100%',
              minHeight: ownsChrome ? '100vh' : 'calc(100vh - 56px)',
              backgroundImage: `url(${background})`,
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
            mb: 2
          }}
        >
          Choose a background
        </Typography>
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
                  borderColor: background.endsWith(image)
                    ? 'primary.main'
                    : 'transparent',
                  '&:hover': {
                    opacity: 0.92
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
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
