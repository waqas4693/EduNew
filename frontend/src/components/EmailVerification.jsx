import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Button,
  Typography,
  CircularProgress
} from '@mui/material'
import { getData } from '../api/api'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
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
          setMessage('Email verified successfully! You can now login to your account.')
        }
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Verification failed. Please try again or contact support.')
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleLogin = () => {
    navigate('/login')
  }

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your email address.
            </Typography>
          </Box>
        )
      
      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
              ✅ Email Verified Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{ borderRadius: '8px' }}
            >
              Login to Your Account
            </Button>
          </Box>
        )
      
      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" sx={{ mb: 2, color: 'error.main' }}>
              ❌ Verification Failed
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={handleLogin}
              sx={{ borderRadius: '8px' }}
            >
              Go to Login
            </Button>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 2
      }}
    >
      <Paper
        sx={{
          maxWidth: 500,
          width: '100%',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  )
}

export default EmailVerification 