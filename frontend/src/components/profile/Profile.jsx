import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Avatar
} from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { postData } from '../../api/api'
import LockResetIcon from '@mui/icons-material/LockReset'

const Profile = () => {
  const { user } = useAuth()
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (event) => {
    setPasswords(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await postData(
        'auth/update-password',
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.status === 200) {
        setSuccess('Password updated successfully')
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: 4, borderRadius: '16px' }}>
        <Stack spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2.5rem'
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Avatar>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              {user?.name || 'User Profile'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>

          {/* <Divider sx={{ width: '100%' }} /> */}

          <Typography variant="h6" sx={{ alignSelf: 'flex-start' }}>
            Change Password
          </Typography>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={1.5} alignItems="center">
              {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>}

              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                width: '100%'
              }}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={handleChange('currentPassword')}
                  required
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />

                <TextField
                  label="New Password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={handleChange('newPassword')}
                  required
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<LockResetIcon />}
                sx={{ 
                  mt: 2,
                  px: 3,
                  alignSelf: 'end'
                }}
                // size="small"
              >
                Update Password
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Profile 