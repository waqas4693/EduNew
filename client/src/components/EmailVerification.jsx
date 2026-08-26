import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress } from '@mui/material'
import { getData } from '../api/api'
import AuthShell, { COLORS } from './auth/AuthShell'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. Please contact support.')
        return
      }

      try {
        const response = await getData(`email-verification/verify/${token}`)
        if (response.status === 200) {
          setStatus('success')
          setMessage(
            'Email verified successfully! You can now sign in to your account.'
          )
        }
      } catch (error) {
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            'Verification failed. Please try again or contact support.'
        )
      }
    }

    verifyEmail()
  }, [searchParams])

  if (status === 'verifying') {
    return (
      <AuthShell
        title="Verify email"
        subtitle="Please wait while we verify your email address."
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={36} sx={{ color: COLORS.blue }} />
        </Box>
      </AuthShell>
    )
  }

  if (status === 'success') {
    return (
      <AuthShell title="Email verified" subtitle={message}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{
            textTransform: 'none',
            fontFamily: '"Source Sans 3", sans-serif',
            fontWeight: 700,
            fontSize: 16,
            py: 1.35,
            borderRadius: '10px',
            bgcolor: COLORS.blue,
            boxShadow: 'none',
            '&:hover': { bgcolor: COLORS.blueDeep, boxShadow: 'none' }
          }}
        >
          Sign in to your account
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Verification failed" subtitle={message}>
      <Button
        fullWidth
        variant="contained"
        onClick={() => navigate('/login')}
        sx={{
          textTransform: 'none',
          fontFamily: '"Source Sans 3", sans-serif',
          fontWeight: 700,
          fontSize: 16,
          py: 1.35,
          borderRadius: '10px',
          bgcolor: COLORS.blue,
          boxShadow: 'none',
          '&:hover': { bgcolor: COLORS.blueDeep, boxShadow: 'none' }
        }}
      >
        Go to sign in
      </Button>
    </AuthShell>
  )
}

export default EmailVerification
