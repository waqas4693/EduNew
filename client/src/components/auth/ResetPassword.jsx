import {
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material'
import { useState, useEffect } from 'react'
import { postData, getData } from '../../api/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import AuthShell, { COLORS } from './AuthShell'

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
      } catch {
        setError(
          'This reset link is invalid or has expired. Please request a new password reset.'
        )
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

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

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
        setSuccess(
          'Password reset successfully! You can now sign in with your new password.'
        )
        setFormData({
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (err) {
      if (err.status === 400) {
        setDialogTitle('Invalid Request')
        setError(
          err.response?.data?.message || 'Invalid or expired reset token.'
        )
      } else if (err.status === 403) {
        setDialogTitle('Account Inactive')
        setError(
          'This account is currently inactive. Please contact administration.'
        )
      } else {
        setDialogTitle('Error')
        setError(
          'An error occurred while resetting your password. Please try again.'
        )
      }
      setOpenDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const fieldSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Source Sans 3", sans-serif',
      fontSize: 15,
      borderRadius: '10px',
      bgcolor: COLORS.white,
      '& fieldset': { borderColor: COLORS.line },
      '&:hover fieldset': { borderColor: 'rgba(31, 126, 194, 0.55)' },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.blue,
        borderWidth: 1.5
      }
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Source Sans 3", sans-serif'
    }
  }

  if (validating) {
    return (
      <AuthShell title="Reset password" subtitle="Checking your reset link…">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={36} sx={{ color: COLORS.blue }} />
        </Box>
      </AuthShell>
    )
  }

  if (!tokenValid) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle={error || 'This link is invalid or has expired.'}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/forgot-password')}
          sx={{
            textTransform: 'none',
            fontFamily: '"Source Sans 3", sans-serif',
            fontWeight: 700,
            fontSize: 16,
            py: 1.35,
            borderRadius: '10px',
            bgcolor: COLORS.blue,
            boxShadow: 'none',
            mb: 1.5,
            '&:hover': { bgcolor: COLORS.blueDeep, boxShadow: 'none' }
          }}
        >
          Request a new reset link
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate('/login')}
          sx={{
            textTransform: 'none',
            fontFamily: '"Source Sans 3", sans-serif',
            fontWeight: 600,
            color: COLORS.blue
          }}
        >
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <>
      <AuthShell
        title="Reset password"
        subtitle="Enter your new password below."
      >
        {success && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              bgcolor: 'rgba(31, 126, 194, 0.08)',
              border: '1px solid rgba(31, 126, 194, 0.25)',
              borderRadius: '10px',
              color: COLORS.navy
            }}
          >
            <Typography
              sx={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 14 }}
            >
              {success}
            </Typography>
          </Box>
        )}

        {error && !openDialog && (
          <Typography
            sx={{
              mb: 2,
              fontSize: 14,
              color: 'error.main',
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="New password"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
            sx={fieldSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth
            label="Confirm new password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            sx={{ ...fieldSx, mb: 2.5 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    edge="end"
                    aria-label="toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontFamily: '"Source Sans 3", sans-serif',
              fontWeight: 700,
              fontSize: 16,
              py: 1.35,
              borderRadius: '10px',
              bgcolor: COLORS.blue,
              boxShadow: 'none',
              '&:hover': { bgcolor: COLORS.blueDeep, boxShadow: 'none' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(31, 126, 194, 0.45)',
                color: COLORS.white
              }
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              'Reset password'
            )}
          </Button>
        </Box>
      </AuthShell>

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
        <DialogTitle
          sx={{ pb: 1, fontFamily: '"Fraunces", serif', fontWeight: 600 }}
        >
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
    </>
  )
}

export default ResetPassword
