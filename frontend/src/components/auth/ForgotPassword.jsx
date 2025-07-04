import {
  Box,
  Paper,
  Button,
  Dialog,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { useState } from 'react'
import { postData } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const navigate = useNavigate()
  
  // Responsive breakpoints
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setError('')
    setSuccess('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    try {
      const response = await postData('password-reset/request', { email })

      if (response.status === 200) {
        setSuccess('If an account with this email exists, a password reset link has been sent.')
        setEmail('')
      }
    } catch (error) {
      if (error.status === 403) {
        setDialogTitle('Account Inactive')
        setError('This account is currently inactive. Please contact administration.')
      } else if (error.status === 500) {
        setDialogTitle('Error')
        setError('Failed to send password reset email. Please try again.')
      } else {
        setDialogTitle('Error')
        setError('An error occurred. Please try again.')
      }
      setOpenDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
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
            Forgot Password
          </Typography>
          
          <Typography
            variant='body2'
            sx={{ 
              mb: { xs: 2, sm: 2.5, md: 3 }, 
              fontSize: { xs: '14px', sm: '15px', md: '16px' }, 
              textAlign: 'center', 
              color: 'text.secondary',
              lineHeight: 1.6
            }}
          >
            Enter your email address and we'll send you a link to reset your password.
          </Typography>

          {success && (
            <Box
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                p: 2,
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                color: '#155724'
              }}
            >
              <Typography variant='body2' sx={{ fontSize: { xs: '14px', sm: '15px', md: '16px' } }}>
                {success}
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder='Email'
              type='email'
              value={email}
              onChange={handleEmailChange}
              required
              disabled={loading}
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '14px', sm: '15px', md: '16px' },
                  borderRadius: { xs: '6px', sm: '7px', md: '8px' }
                }
              }}
              variant='outlined'
            />
            
            <Button
              type='submit'
              variant='contained'
              size={isMobile ? 'medium' : 'large'}
              disabled={loading}
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
                },
                '&:disabled': {
                  backgroundColor: '#cccccc'
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <Button
            variant='text'
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToLogin}
            sx={{
              mt: { xs: 2, sm: 2.5, md: 3 },
              mx: 'auto',
              display: 'block',
              textTransform: 'none',
              color: '#1F7EC2',
              fontSize: { xs: '14px', sm: '15px', md: '16px' },
              '&:hover': {
                backgroundColor: 'rgba(31, 126, 194, 0.1)'
              }
            }}
          >
            Back to Login
          </Button>
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

export default ForgotPassword 