import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  Button,
  Avatar,
  Typography,
  useMediaQuery
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  AccountCircle as ProfileIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { useAppTheme } from '../../context/ThemeContext'
import { LAYOUT_HEADER_HEIGHT } from './layoutConstants'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

const SidebarContent = ({
  open,
  user,
  logout,
  navigate,
  expandedSection,
  setExpandedSection,
  menuItems,
  getRoleName
}) => {
  const toggleSection = (sectionName) => {
    setExpandedSection((current) => (current === sectionName ? null : sectionName))
  }

  return (
    <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: LAYOUT_HEADER_HEIGHT,
          minHeight: LAYOUT_HEADER_HEIGHT,
          px: 2,
          py: 0,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.dark', mr: open ? 2 : 0, width: 36, height: 36 }}>
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        {open && (
          <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
            <Typography sx={{ color: 'white', fontSize: '15px', fontWeight: 'bold', lineHeight: 1.2 }}>
              {getRoleName(user?.role)}
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: 1.2 }}>
              {user?.name}
            </Typography>
          </Box>
        )}
      </Box>

      <List>
        {menuItems.map((item) => {
          const isExpanded = expandedSection === item.text

          return (
            <div key={item.text}>
              {item.subItems ? (
                <>
                  <ListItem
                    button
                    onClick={() => toggleSection(item.text)}
                    sx={{
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
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
                        '& .MuiTypography-root': { color: 'white', fontSize: '16px' }
                      }}
                    />
                    {open &&
                      (isExpanded ? (
                        <ExpandLess sx={{ color: 'white' }} />
                      ) : (
                        <ExpandMore sx={{ color: 'white' }} />
                      ))}
                  </ListItem>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ '& .MuiListItem-root': { py: 0.5 } }}>
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
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                          }}
                        >
                          <ListItemText
                            primary={subItem.text}
                            sx={{
                              opacity: open ? 1 : 0,
                              display: open ? 'block' : 'none',
                              '& .MuiTypography-root': { color: 'white', fontSize: '14px' }
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
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
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
                      '& .MuiTypography-root': { color: 'white', fontSize: '16px' }
                    }}
                  />
                </ListItem>
              )}
            </div>
          )
        })}
      </List>

      <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', mt: 2 }}>
        {!user?.isDemo && (
          <ListItem
            button
            component={Link}
            to={user?.role === STUDENT_ROLE ? '/profile' : '/admin/profile'}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
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
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              sx={{
                opacity: open ? 1 : 0,
                '& .MuiTypography-root': { color: 'white', fontSize: '16px' }
              }}
            />
          </ListItem>
        )}
      </Box>

      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Button
          fullWidth
          onClick={() => {
            logout()
            navigate('/')
          }}
          startIcon={<LogoutIcon />}
          sx={{
            justifyContent: open ? 'flex-start' : 'center',
            minWidth: 0,
            px: 2.5,
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
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
  )
}

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme()
  const { brandColor } = useAppTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const [expandedSection, setExpandedSection] = useState(null)

  const getDrawerWidth = () => {
    if (isMobile) return 240
    if (isTablet) return open ? 240 : 65
    return open ? 240 : 65
  }

  const drawerWidth = getDrawerWidth()
  const widthTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: open
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen
  })

  const paperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    bgcolor: brandColor,
    color: '#fff',
    borderRight: 'none',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    transition: widthTransition,
    backgroundImage: 'none'
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
        { text: 'Course Management', path: '/admin/courses' },
        { text: 'Inactive Courses', path: '/admin/inactive-courses' }
      ]
    },
    {
      text: 'Students',
      icon: <PersonAddIcon />,
      subItems: [
        { text: 'Active Students', path: '/admin/active-students' },
        { text: 'Inactive Students', path: '/admin/inactive-students' },
        { text: 'Add Student', path: '/admin/invite-student' }
      ]
    },
    {
      text: 'Accounts',
      icon: <PersonAddIcon />,
      subItems: [
        { text: 'Create Account', path: '/admin/create-user' },
        { text: 'Update Password', path: '/admin/update-password' }
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
    {
      text: 'Bulk Upload',
      icon: <CloudUploadIcon />,
      path: '/admin/bulk-upload'
    }
  ]

  const studentMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      text: 'Assessment',
      icon: <AssignmentIcon />,
      path: '/assessment'
    }
  ]

  const assessmentMenuItems = [
    {
      text: 'Assessment',
      icon: <AssignmentIcon />,
      subItems: [
        { text: 'Submitted', path: '/admin/assessment-review/submitted' },
        { text: 'Graded', path: '/admin/assessment-review/graded' }
      ]
    }
  ]

  const getMenuItems = () => {
    switch (user?.role) {
      case ADMIN_ROLE:
        return adminMenuItems
      case STUDENT_ROLE:
        return studentMenuItems
      case ASSESSOR_ROLE:
      case MODERATOR_ROLE:
      case VERIFIER_ROLE:
        return assessmentMenuItems
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const getRoleName = (roleId) => {
    switch (roleId) {
      case ADMIN_ROLE:
        return 'Administrator'
      case STUDENT_ROLE:
        return 'Student'
      case ASSESSOR_ROLE:
        return 'Assessor'
      case MODERATOR_ROLE:
        return 'Moderator'
      case VERIFIER_ROLE:
        return 'Verifier'
      default:
        return 'User'
    }
  }

  const contentProps = {
    open,
    user,
    logout,
    navigate,
    expandedSection,
    setExpandedSection,
    menuItems,
    getRoleName
  }

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': paperSx
        }}
      >
        <SidebarContent {...contentProps} />
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: widthTransition,
        '& .MuiDrawer-paper': paperSx
      }}
    >
      <SidebarContent {...contentProps} />
    </Drawer>
  )
}

export default Sidebar
