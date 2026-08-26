import {
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Link,
  keyframes,
  CircularProgress
} from '@mui/material'
import { useState } from 'react'
import { postData } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2
const ASSESSOR_ROLE = 3
const MODERATOR_ROLE = 4
const VERIFIER_ROLE = 5

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const softZoom = keyframes`
  from { transform: scale(1); }
  to { transform: scale(1.05); }
`

const COLORS = {
  navy: '#0A2540',
  ink: '#12304A',
  blue: '#1F7EC2',
  blueDeep: '#155A8F',
  paper: '#F5F8FB',
  white: '#FFFFFF',
  line: 'rgba(10, 37, 64, 0.12)'
}

const BrandBackdrop = () => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      bgcolor: COLORS.navy
    }}
  >
    <Box
      component="img"
      src="/hero-learning.jpg"
      alt=""
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: '55% center',
        animation: `${softZoom} 20s ease-out forwards`
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(160deg, rgba(7,22,38,0.88) 0%, rgba(7,22,38,0.72) 45%, rgba(10,37,64,0.55) 100%)'
      }}
    />
  </Box>
)

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await postData('auth', formData)

      if (response.status === 200) {
        const { token, user } = response.data.data

        if (user.role === STUDENT_ROLE && user.courseIds) {
          const enrollmentDates = {}
          user.courseIds.forEach(({ courseId, enrollmentDate }) => {
            enrollmentDates[courseId] = enrollmentDate
          })
          localStorage.setItem('enrollmentDates', JSON.stringify(enrollmentDates))
        }

        login(user, token)

        switch (user.role) {
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
    } catch (err) {
      if (err.status === 403) {
        setDialogTitle('Account Inactive')
        setError(
          'Your account is currently inactive. Please contact administration.'
        )
      } else if (err.status === 404) {
        setDialogTitle('User Not Found')
        setError('User not found with this email.')
      } else if (err.status === 401) {
        setDialogTitle('Invalid Credentials')
        setError('Invalid email or password.')
      } else {
        setDialogTitle('Error')
        setError('An error occurred. Please try again.')
      }
      setOpenDialog(true)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Source Sans 3", sans-serif',
      fontSize: 15,
      borderRadius: '10px',
      bgcolor: COLORS.white,
      '& fieldset': {
        borderColor: COLORS.line
      },
      '&:hover fieldset': {
        borderColor: 'rgba(31, 126, 194, 0.55)'
      },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.blue,
        borderWidth: 1.5
      }
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Source Sans 3", sans-serif'
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
        fontFamily: '"Source Sans 3", sans-serif',
        bgcolor: COLORS.paper
      }}
    >
      {/* Brand panel */}
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '100vh',
          p: 5,
          color: COLORS.white,
          overflow: 'hidden'
        }}
      >
        <BrandBackdrop />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="EduSupplements"
            sx={{
              height: 42,
              width: 'auto',
              maxWidth: 200,
              objectFit: 'contain',
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(255,255,255,0.94)',
              mb: 6
            }}
          />
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 600,
              fontSize: { md: '2.6rem', lg: '3rem' },
              lineHeight: 1.1,
              mb: 2,
              maxWidth: 420,
              animation: `${fadeUp} 0.8s ease forwards`
            }}
          >
            Welcome back to your learning space.
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Source Sans 3", sans-serif',
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.78)',
              maxWidth: 380,
              animation: `${fadeUp} 0.8s ease 0.15s both`
            }}
          >
            Sign in to continue your courses, track progress, and pick up exactly where you left off.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src="/ehouse-logo.svg"
            alt="Partner"
            sx={{
              height: 26,
              opacity: 0.8,
              filter: 'brightness(0) invert(1)'
            }}
          />
        </Box>
      </Box>

      {/* Auth form panel — interaction surface */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 4, md: 5 },
          bgcolor: COLORS.paper,
          position: 'relative'
        }}
      >
        {/* Mobile brand strip */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="EduSupplements"
            sx={{
              height: 36,
              width: 'auto',
              maxWidth: 160,
              objectFit: 'contain'
            }}
          />
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
              color: COLORS.navy,
              fontWeight: 600,
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            Home
          </Button>
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            mx: 'auto',
            animation: `${fadeUp} 0.7s ease forwards`
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              textTransform: 'none',
              color: 'rgba(10, 37, 64, 0.65)',
              fontWeight: 600,
              fontFamily: '"Source Sans 3", sans-serif',
              mb: 3,
              px: 0,
              '&:hover': {
                bgcolor: 'transparent',
                color: COLORS.navy
              }
            }}
          >
            Back to home
          </Button>

          <Typography
            component="h1"
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 600,
              fontSize: { xs: '1.85rem', md: '2.1rem' },
              color: COLORS.navy,
              mb: 0.75
            }}
          >
            Sign in
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Source Sans 3", sans-serif',
              fontSize: '0.98rem',
              color: 'rgba(10, 37, 64, 0.62)',
              mb: 3.5
            }}
          >
            Use the email and password provided for your EduSupplements account.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: '14px',
              bgcolor: COLORS.white,
              border: `1px solid ${COLORS.line}`
            }}
          >
            <TextField
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              sx={fieldSx}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              sx={{ ...fieldSx, mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 2.5 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                sx={{
                  color: COLORS.blue,
                  textDecoration: 'none',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  '&:hover': {
                    textDecoration: 'underline',
                    color: COLORS.blueDeep
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                textTransform: 'none',
                fontFamily: '"Source Sans 3", sans-serif',
                fontWeight: 700,
                fontSize: 16,
                py: 1.35,
                borderRadius: '10px',
                bgcolor: COLORS.blue,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: COLORS.blueDeep,
                  boxShadow: 'none'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(31, 126, 194, 0.45)',
                  color: COLORS.white
                }
              }}
            >
              {submitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: 280, sm: 340 },
            mx: 2,
            fontFamily: '"Source Sans 3", sans-serif'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: '"Source Sans 3", sans-serif' }}>
            {error}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleCloseDialog}
            sx={{
              textTransform: 'none',
              bgcolor: COLORS.blue,
              borderRadius: '8px',
              boxShadow: 'none',
              '&:hover': { bgcolor: COLORS.blueDeep, boxShadow: 'none' }
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
