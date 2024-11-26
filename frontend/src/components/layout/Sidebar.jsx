import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Button
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import SchoolIcon from '@mui/icons-material/School'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import DescriptionIcon from '@mui/icons-material/Description'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const adminMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Add Course', icon: <SchoolIcon />, path: '/admin/add-course' },
  { text: 'Invite Student', icon: <PersonAddIcon />, path: '/admin/invite-student' },
  // { text: 'Manage Students', icon: <PeopleIcon />, path: '/admin/students' },
  // { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }
]

const studentMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  // { text: 'Assessments', icon: <SchoolIcon />, path: '/assessments' },
  // { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
]

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const drawerWidth = open ? 240 : 65

  const menuItems = user?.role === ADMIN_ROLE ? adminMenuItems : studentMenuItems

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          }),
          overflowX: 'hidden',
          bgcolor: 'primary.main',
          color: 'white'
        }
      }}
    >
      <Box sx={{ 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.text}
              sx={{
                minHeight: 48,
                px: 2.5,
                justifyContent: open ? 'initial' : 'center',
                width: '100%',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  width: 24,
                  color: 'white'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  display: open ? 'block' : 'none',
                  '& .MuiTypography-root': {
                    color: 'white'
                  }
                }} 
              />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ 
          mt: 'auto', 
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <Button
            fullWidth
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              justifyContent: open ? 'flex-start' : 'center',
              minWidth: 0,
              px: 2.5,
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '& .MuiButton-startIcon': {
                mr: open ? 2 : 0,
                color: 'white'
              }
            }}
          >
            {open && 'Logout'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default Sidebar 