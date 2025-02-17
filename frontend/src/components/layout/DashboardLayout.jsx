import { useState } from 'react'
import { Box, useMediaQuery, useTheme, IconButton, Dialog, Grid2 } from '@mui/material'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import PaletteIcon from '@mui/icons-material/Palette'

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
  const [background, setBackground] = useState(`/background-images/${backgroundImages[0]}`)
  const [openDialog, setOpenDialog] = useState(false)

  const handleImageSelect = (image) => {
    setBackground(`/background-images/${image}`)
    setOpenDialog(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar onMenuClick={toggleSidebar}>
          <IconButton
            onClick={() => setOpenDialog(true)}
            sx={{ 
              color: 'primary.main',
              right: 16
            }}
          >
            <PaletteIcon />
          </IconButton>
        </Navbar>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            transition: theme.transitions.create(['width', 'margin-left']),
            backgroundImage: background ? `url(${background})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: 'calc(100vh - 64px)',
            bgcolor: 'transparent'
          }}
        >
          {children}
        </Box>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Grid2 container spacing={2}>
            {backgroundImages.map((image) => (
              <Grid2 xs={6} sm={4} md={3} key={image}>
                <img
                  src={`/background-images/${image}`}
                  alt={image}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                  onClick={() => handleImageSelect(image)}
                />
              </Grid2>
            ))}
          </Grid2>
        </Box>
      </Dialog>
    </Box>
  )
}

export default DashboardLayout 