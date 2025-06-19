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
  Analytics as AnalyticsIcon,
  AccountCircle as ProfileIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

// SidebarContent: shared sidebar content for both permanent and temporary drawers
const SidebarContent = ({ open, user, logout, navigate, openCourses, setOpenCourses, openStudents, setOpenStudents, openAssessment, setOpenAssessment, openAccounts, setOpenAccounts, menuItems, getRoleName, ADMIN_ROLE, STUDENT_ROLE }) => (
  <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
    }}>
      <Avatar sx={{ bgcolor: 'primary.dark', mr: open ? 2 : 0 }}>
        {user?.name?.charAt(0).toUpperCase()}
      </Avatar>
      {open && (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {getRoleName(user?.role)}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              lineHeight: 1
            }}
          >
            {user?.name}
          </Typography>
        </Box>
      )}
    </Box>

    <List>
      {menuItems.map((item) => (
        <div key={item.text}>
          {item.subItems ? (
            <>
              <ListItem
                button
                onClick={() => {
                  switch (item.text) {
                    case 'Courses':
                      setOpenCourses(!openCourses)
                      break
                    case 'Students':
                      setOpenStudents(!openStudents)
                      break
                    case 'Assessment':
                      setOpenAssessment(!openAssessment)
                      break
                    case 'Accounts':
                      setOpenAccounts(!openAccounts)
                      break
                    default:
                      break
                  }
                }}
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
                {open && (
                  item.text === 'Courses' ? (openCourses ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />) :
                    item.text === 'Students' ? (openStudents ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />) :
                      item.text === 'Assessment' ? (openAssessment ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />) :
                        item.text === 'Accounts' ? (openAccounts ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />) :
                          null
                )}
              </ListItem>
              <Collapse
                in={
                  item.text === 'Courses' ? openCourses :
                    item.text === 'Students' ? openStudents :
                      item.text === 'Assessment' ? openAssessment :
                        item.text === 'Accounts' ? openAccounts :
                          false
                }
                timeout="auto"
                unmountOnExit
              >
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
      borderTop: '1px solid rgba(255, 255, 255, 0.12)',
      mt: 2
    }}>
      {!user?.isDemo && (
        <ListItem
          button
          component={Link}
          to={user?.role === STUDENT_ROLE ? '/profile' : '/admin/profile'}
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
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
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
    </Box>

    <Box sx={{
      mt: 'auto',
      p: 2,
      borderTop: '1px solid rgba(255, 255, 255, 0.12)'
    }}>
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
)

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  
  // Determine drawer width based on screen size
  const getDrawerWidth = () => {
    if (isMobile) return 240 // Use full width for temporary drawer on mobile
    if (isTablet) return open ? 240 : 65 // Shrink on tablet
    return open ? 240 : 65 // Desktop behavior unchanged
  }
  
  const drawerWidth = getDrawerWidth()

  const [openCourses, setOpenCourses] = useState(false)
  const [openStudents, setOpenStudents] = useState(false)
  const [openAssessment, setOpenAssessment] = useState(false)
  const [openAccounts, setOpenAccounts] = useState(false)

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
      text: 'Accounts',
      icon: <PersonAddIcon />,
      subItems: [
        { text: 'Create Account', path: '/admin/create-user' }
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

  // On mobile, render a temporary Drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
          }
        }}
      >
        <SidebarContent
          open={open}
          user={user}
          logout={logout}
          navigate={navigate}
          openCourses={openCourses}
          setOpenCourses={setOpenCourses}
          openStudents={openStudents}
          setOpenStudents={setOpenStudents}
          openAssessment={openAssessment}
          setOpenAssessment={setOpenAssessment}
          openAccounts={openAccounts}
          setOpenAccounts={setOpenAccounts}
          menuItems={menuItems}
          getRoleName={getRoleName}
          ADMIN_ROLE={ADMIN_ROLE}
          STUDENT_ROLE={STUDENT_ROLE}
        />
      </Drawer>
    )
  }

  // Tablet/desktop: permanent Drawer as before
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
      <SidebarContent
        open={open}
        user={user}
        logout={logout}
        navigate={navigate}
        openCourses={openCourses}
        setOpenCourses={setOpenCourses}
        openStudents={openStudents}
        setOpenStudents={setOpenStudents}
        openAssessment={openAssessment}
        setOpenAssessment={setOpenAssessment}
        openAccounts={openAccounts}
        setOpenAccounts={setOpenAccounts}
        menuItems={menuItems}
        getRoleName={getRoleName}
        ADMIN_ROLE={ADMIN_ROLE}
        STUDENT_ROLE={STUDENT_ROLE}
      />
    </Drawer>
  )
}

export default Sidebar 