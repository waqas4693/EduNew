import {
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material'
import { useState } from 'react'
import { postData } from '../../api/api'
import AuthShell, { COLORS } from './AuthShell'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')

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
        setSuccess(
          'If an account with this email exists, a password reset link has been sent.'
        )
        setEmail('')
      }
    } catch (err) {
      if (err.status === 403) {
        setDialogTitle('Account Inactive')
        setError(
          'This account is currently inactive. Please contact administration.'
        )
      } else if (err.status === 500) {
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

  const fieldSx = {
    mb: 2.5,
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

  return (
    <>
      <AuthShell
        title="Forgot password"
        subtitle="Enter your email address and we'll send you a link to reset your password."
      >
        {success && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              bgcolor: 'rgba(31, 126, 194, 0.08)',
              border: `1px solid rgba(31, 126, 194, 0.25)`,
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

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
            autoComplete="email"
            sx={fieldSx}
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
              'Send reset link'
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

export default ForgotPassword
