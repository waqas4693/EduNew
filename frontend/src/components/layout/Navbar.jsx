import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

const Navbar = ({ onMenuClick, children }) => {
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
        {children}
      </Toolbar>
    </AppBar>
  )
}

export default Navbar 