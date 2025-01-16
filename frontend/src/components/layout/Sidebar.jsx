import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  Button
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const drawerWidth = open ? 240 : 65

  const [openCourses, setOpenCourses] = useState(false)
  const [openStudents, setOpenStudents] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const adminMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard'
    },
    {
      text: 'Courses',
      icon: <SchoolIcon />,
      subItems: [
        { text: 'Course Management', path: '/admin/add-course' },
        { text: 'InActive Courses', path: '/admin/inactive-courses' }
      ]
    },
    {
      text: 'Students',
      icon: <PersonAddIcon />,
      subItems: [
        { text: 'Active Students', path: '/admin/active-students' },
        { text: 'Inactive Students', path: '/admin/inactive-students' },
        { text: 'Invite Student', path: '/admin/invite-student' }
      ]
    },
    {
      text: 'Assessment',
      icon: <AssignmentIcon />,
      subItems: [
        { text: 'Submitted', path: '/admin/assessment-review/submitted' },
        { text: 'Graded', path: '/admin/assessment-review/graded' }
      ]
    },
    // {
    //   text: 'Resource Analytics',
    //   icon: <AnalyticsIcon />,
    //   path: '/admin/resource-analytics'
    // }
  ]

  const studentMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      text: 'Profile',
      icon: <DashboardIcon />,
      path: '/profile'
    },
    {
      text: 'Assessment',
      icon: <AssignmentIcon />,
      path: '/assessment'
    }
  ]

  const menuItems = user?.role === ADMIN_ROLE ? adminMenuItems : studentMenuItems

  return (
    <Drawer
      variant='permanent'
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'primary.main',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          })
        }
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <List>
          {menuItems.map((item) => (
            <div key={item.text}>
              {item.subItems ? (
                <>
                  <ListItem
                    button
                    onClick={() => item.text === 'Courses' ? setOpenCourses(!openCourses) : setOpenStudents(!openStudents)}
                    sx={{
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
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
                        color: 'white'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        opacity: open ? 1 : 0,
                        '& .MuiTypography-root': {
                          color: 'white',
                          fontSize: '16px'
                        }
                      }} 
                    />
                    {open && (item.text === 'Courses' ? (openCourses ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />) :
                            (openStudents ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />))}
                  </ListItem>
                  <Collapse in={item.text === 'Courses' ? openCourses : openStudents} timeout="auto" unmountOnExit>
                    <List 
                      component="div" 
                      disablePadding
                      sx={{ 
                        '& .MuiListItem-root': { 
                          py: 0.5  // Reduced padding top and bottom
                        } 
                      }}
                    >
                      {item.subItems.map((subItem) => (
                        <ListItem
                          button
                          component={Link}
                          to={subItem.path}
                          key={subItem.text}
                          sx={{
                            pl: 8.5,
                            justifyContent: open ? 'initial' : 'center',
                            width: '100%',
                            '&:hover': {
                              bgcolor: 'primary.dark'
                            }
                          }}
                        >
                          <ListItemText 
                            primary={subItem.text} 
                            sx={{ 
                              opacity: open ? 1 : 0,
                              display: open ? 'block' : 'none',
                              '& .MuiTypography-root': {
                                color: 'white',
                                fontSize: '14px'
                              }
                            }} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
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
                      color: 'white'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      '& .MuiTypography-root': {
                        color: 'white',
                        fontSize: '16px'
                      }
                    }} 
                  />
                </ListItem>
              )}
            </div>
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