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
  DialogActions,
  InputAdornment,
  IconButton
} from '@mui/material'
import { useState, useEffect } from 'react'
import { postData, getData } from '../../api/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Visibility, VisibilityOff } from '@mui/icons-material'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [validating, setValidating] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  
  // Responsive breakpoints
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid reset link. Please request a new password reset.')
        setValidating(false)
        return
      }

      try {
        const response = await getData(`password-reset/validate/${token}`)
        if (response.status === 200) {
          setTokenValid(true)
        }
      } catch (error) {
        setError('This reset link is invalid or has expired. Please request a new password reset.')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await postData('password-reset/reset', {
        token,
        newPassword: formData.newPassword
      })

      if (response.status === 200) {
        setSuccess('Password reset successfully! You can now login with your new password.')
        setFormData({
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      if (error.status === 400) {
        setDialogTitle('Invalid Request')
        setError(error.response?.data?.message || 'Invalid or expired reset token.')
      } else if (error.status === 403) {
        setDialogTitle('Account Inactive')
        setError('This account is currently inactive. Please contact administration.')
      } else {
        setDialogTitle('Error')
        setError('An error occurred while resetting your password. Please try again.')
      }
      setOpenDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleRequestNewReset = () => {
    navigate('/forgot-password')
  }

  if (validating) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}
      >
        <Typography variant='h6' sx={{ color: 'text.secondary' }}>
          Validating reset link...
        </Typography>
      </Box>
    )
  }

  if (!tokenValid) {
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
                fontWeight: 500,
                color: 'error.main'
              }}
            >
              Invalid Reset Link
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
              {error}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant='contained'
                onClick={handleRequestNewReset}
                size={isMobile ? 'medium' : 'large'}
                sx={{
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
                Request New Reset Link
              </Button>

              <Button
                variant='text'
                onClick={handleBackToLogin}
                sx={{
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
            </Box>
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
      </Box>
    )
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
            Reset Password
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
            Enter your new password below.
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
              placeholder='New Password'
              name='newPassword'
              type={showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
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
            
            <TextField
              fullWidth
              placeholder='Confirm New Password'
              name='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton 
                      onClick={handleClickShowConfirmPassword} 
                      edge='end'
                      sx={{
                        fontSize: { xs: '18px', sm: '20px', md: '24px' }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <Button
            variant='text'
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

export default ResetPassword 