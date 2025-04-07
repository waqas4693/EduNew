import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Avatar,
  Grid
} from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { getData, postData, patchData } from '../../api/api'
import LockResetIcon from '@mui/icons-material/LockReset'
import SaveIcon from '@mui/icons-material/Save'

const Profile = () => {
  const { user, setUser } = useAuth()
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    contactNo: '',
    address: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if(user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        contactNo: user.contactNo || '',
        address: user.address || ''
      })
    }
  }, [user])

  const handlePasswordChange = (field) => (event) => {
    setPasswords(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setProfileError('')
    setProfileSuccess('')
  }

  const handlePasswordSubmit = async (e) => {
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await patchData(
        'auth/update-profile',
        {
          name: profileData.name,
          email: profileData.email,
          contactNo: profileData.contactNo,
          address: profileData.address
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.status === 200) {
        setProfileSuccess('Profile updated successfully')
        // Update the user context with new information
        setUser(prev => ({
          ...prev,
          name: profileData.name,
          email: profileData.email,
          contactNo: profileData.contactNo,
          address: profileData.address
        }))
      }
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: 4, borderRadius: '16px' }}>
        <Stack spacing={4} alignItems="center">
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

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              {user?.name || 'User Profile'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {user?.email}
            </Typography>

            <Divider sx={{ width: '100%', mb: 3 }} />

            {/* Profile Information Form */}
            <Typography variant="h6" sx={{ alignSelf: 'flex-start', textAlign: 'left', mb: 2 }}>
              Profile Information
            </Typography>

            <form onSubmit={handleProfileSubmit} style={{ width: '100%' }}>
              <Stack spacing={2}>
                {profileError && <Alert severity="error">{profileError}</Alert>}
                {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={profileData.name}
                      onChange={handleProfileChange('name')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={profileData.contactNo}
                      onChange={handleProfileChange('contactNo')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={profileData.address}
                      onChange={handleProfileChange('address')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={profileLoading}
                    startIcon={<SaveIcon />}
                  >
                    Update Profile
                  </Button>
                </Box>
              </Stack>
            </form>

            <Divider sx={{ width: '100%', my: 3 }} />

            {/* Change Password Form */}
            <Typography variant="h6" sx={{ alignSelf: 'flex-start', textAlign: 'left', mb: 2 }}>
              Change Password
            </Typography>

            <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<LockResetIcon />}
                  >
                    Update Password
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Profile 