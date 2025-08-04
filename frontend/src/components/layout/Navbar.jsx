import MenuIcon from '@mui/icons-material/Menu'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { AppBar, IconButton, Toolbar, Typography, useTheme, useMediaQuery, Box } from '@mui/material'

const Navbar = ({ onMenuClick, children, onCalendarClick }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'white',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ color: 'primary.main' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          EDU SUPPLEMENTS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && onCalendarClick && (
            <IconButton
              onClick={onCalendarClick}
              sx={{ color: 'primary.main' }}
            >
              <CalendarTodayIcon />
            </IconButton>
          )}
          {children}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar