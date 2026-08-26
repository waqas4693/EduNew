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
        boxShadow: '0px 1px 0px rgba(10, 37, 64, 0.08)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label="Open menu"
          sx={{ color: 'secondary.dark' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{
            color: 'secondary.dark',
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
            fontSize: { xs: '1.05rem', sm: '1.2rem' },
            letterSpacing: '0.01em'
          }}
        >
          EduSupplements
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && onCalendarClick && (
            <IconButton
              onClick={onCalendarClick}
              aria-label="Open calendar"
              sx={{ color: 'secondary.dark' }}
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
