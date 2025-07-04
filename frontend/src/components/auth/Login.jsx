import {
  Box,
  Paper,
  Button,
  Dialog,
  useTheme,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  useMediaQuery,
  DialogContent,
  DialogActions,
  InputAdornment,
  Link
} from '@mui/material'
import { useState } from 'react'
import { postData } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Visibility, VisibilityOff } from '@mui/icons-material'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('student')
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  
  // Responsive breakpoints
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleTabChange = tab => {
    setActiveTab(tab)
    setError('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    try {
      const response = await postData('auth', formData)

      if (response.status === 200) {
        const { token, user } = response.data.data

        // Only process enrollment dates for students
        if (user.role === STUDENT_ROLE && user.courseIds) {
          const enrollmentDates = {}
          user.courseIds.forEach(({ courseId, enrollmentDate }) => {
            enrollmentDates[courseId] = enrollmentDate
          })
          localStorage.setItem('enrollmentDates', JSON.stringify(enrollmentDates))
        }

        // Login with user data and token
        login(user, token)

        // Navigate based on role
        switch(user.role) {
          case ADMIN_ROLE:
            navigate('/admin/dashboard', { replace: true })
            break
          case STUDENT_ROLE:
            navigate('/dashboard', { replace: true })
            break
          case ASSESSOR_ROLE:
          case MODERATOR_ROLE:
          case VERIFIER_ROLE:
            navigate('/admin/assessment-review/submitted', { replace: true })
            break
          default:
            setError('Invalid user role')
            break
        }
      }
    } catch (error) {
      if (error.status === 403) {
        setDialogTitle('Account Inactive')
        setError(
          'Your account is currently inactive. Please contact administration.'
        )
      } else if (error.status === 404) {
        setDialogTitle('User Not Found')
        setError('User not found with this email.')
      } else if (error.status === 401) {
        setDialogTitle('Invalid Credentials')
        setError('Invalid email or password.')
      } else {
        setDialogTitle('Error')
        setError('An error occurred. Please try again.')
      }
      setOpenDialog(true)
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          height: { xs: '100px', sm: '120px', md: '150px' }     
        }}
      >
        <Box
          sx={{
            mr: { xs: 1, sm: 2, md: 3 },
            width: { xs: '8%', sm: '9%', md: '10%' },
            height: { xs: '25px', sm: '30px', md: '35%' },
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
        <Box
          alt='Logo'
          src='/logo.png'
          component='img'
          sx={{
            height: '100%',
            objectFit: 'contain',
            px: { xs: 0.5, sm: 1 },
            width: { xs: '25%', sm: '20%', md: '15%' }
          }}
        />
        <Box
          sx={{
            ml: { xs: 1, sm: 2, md: 3 },
            flexGrow: 1,
            height: { xs: '25px', sm: '30px', md: '35%' },
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Paper
          sx={{
            p: { xs: 3, sm: 4, md: '60px' },
            width: { xs: '100%', sm: '80%', md: '40%' },
            maxWidth: { xs: '400px', sm: '500px', md: '600px' },
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            backgroundColor: '#ffffff',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography
            variant='h5'
            component='h1'
            sx={{ 
              mb: { xs: 2, sm: 2.5, md: 3 }, 
              fontSize: { xs: '18px', sm: '19px', md: '20px' }, 
              textAlign: 'center', 
              fontWeight: 500 
            }}
          >
            Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder='Email'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '14px', sm: '15px', md: '16px' },
                  borderRadius: { xs: '6px', sm: '7px', md: '8px' }
                }
              }}
              variant='outlined'
            />
            <TextField
              fullWidth
              placeholder='Password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{
                mb: { xs: 1, sm: 1.5, md: 2 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: '6px', sm: '7px', md: '8px' },
                  fontSize: { xs: '14px', sm: '15px', md: '16px' }
                }
              }}
              variant='outlined'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton 
                      onClick={handleClickShowPassword} 
                      edge='end'
                      sx={{
                        fontSize: { xs: '18px', sm: '20px', md: '24px' }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right', mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                sx={{
                  color: '#1F7EC2',
                  textDecoration: 'none',
                  fontSize: { xs: '13px', sm: '14px', md: '15px' },
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1769aa'
                  }
                }}
              >
                Forgot Password?
              </Link>
            </Box>
            
            <Button
              type='submit'
              variant='contained'
              size={isMobile ? 'medium' : 'large'}
              sx={{
                mx: 'auto',
                display: 'block',
                textTransform: 'none',
                backgroundColor: '#1F7EC2',
                py: { xs: 1, sm: 1.2, md: 1.5 },
                px: { xs: '20px', sm: '25px', md: '30px' },
                fontSize: { xs: '14px', sm: '15px', md: '16px' },
                borderRadius: { xs: '6px', sm: '7px', md: '8px' },
                '&:hover': {
                  backgroundColor: '#1769aa'
                }
              }}
            >
              Log In
            </Button>
          </form>
        </Paper>
      </Box>

      {/* Bottom Bar */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          height: { xs: '100px', sm: '120px', md: '150px' },
        }}
      >
        <Box
          sx={{
            mr: { xs: 1, sm: 2, md: 3 },
            width: { xs: '45%', sm: '60%', md: '75%' },
            height: { xs: '25px', sm: '30px', md: '30%' },
            background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
          }}
        />
        <Box
          alt='Logo'
          component='img'
          src='/ehouse-logo.svg'
          sx={{
            height: '90%',
            objectFit: 'contain',
            px: { xs: 0.5, sm: 1 },
            width: { xs: '20%', sm: '15%', md: '10%' },
          }}
        />
        <Box
          sx={{
            ml: { xs: 1, sm: 2, md: 3 },
            flexGrow: 1,
            height: { xs: '25px', sm: '30px', md: '30%' },
            background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
          }}
        />
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: { xs: 1, sm: 1.5, md: 2 },
            minWidth: { xs: 280, sm: 300, md: 350 },
            mx: { xs: 2, sm: 3, md: 4 }
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontSize: { xs: '16px', sm: '18px', md: '20px' } }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: { xs: '14px', sm: '15px', md: '16px' } }}>
            {error}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            variant='contained'
            onClick={handleCloseDialog}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              fontSize: { xs: '14px', sm: '15px', md: '16px' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Login