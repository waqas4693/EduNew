import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useAuth } from '../../context/AuthContext'
import { postData, patchData } from '../../api/api'
import LockResetIcon from '@mui/icons-material/LockReset'
import SaveIcon from '@mui/icons-material/Save'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PageShell from '../layout/PageShell'

const ROLE_LABELS = {
  1: 'Administrator',
  2: 'Student',
  3: 'Assessor',
  4: 'Moderator',
  5: 'Verifier'
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
    '& fieldset': { borderColor: 'rgba(10, 37, 64, 0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(31, 126, 194, 0.55)' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 }
  }
}

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
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        contactNo: user.contactNo || '',
        address: user.address || ''
      })
    }
  }, [user])

  const roleLabel = ROLE_LABELS[user?.role] || 'User'

  const handlePasswordChange = (field) => (event) => {
    setPasswords((prev) => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleProfileChange = (field) => (event) => {
    setProfileData((prev) => ({
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
            Authorization: `Bearer ${token}`
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password')
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
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.status === 200) {
        setProfileSuccess('Profile updated successfully')
        setUser((prev) => ({
          ...prev,
          name: profileData.name,
          email: profileData.email,
          contactNo: profileData.contactNo,
          address: profileData.address
        }))
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 } }}>
      <PageShell kicker="Account" title="Profile">
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: '#F5F8FB',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontFamily: '"Fraunces", serif',
                    fontSize: '2rem',
                    fontWeight: 600
                  }}
                >
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces", serif',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: 'secondary.dark',
                    mb: 0.75
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
                <Chip
                  label={roleLabel}
                  size="small"
                  sx={{
                    mb: 2.5,
                    bgcolor: 'rgba(31, 126, 194, 0.12)',
                    color: 'primary.dark',
                    fontWeight: 600
                  }}
                />
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <MailOutlineIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: 13, wordBreak: 'break-word' }}>
                      {user?.email || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: 13 }}>
                      {user?.contactNo || 'No contact number'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary' }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, mt: 0.2 }} />
                    <Typography sx={{ fontSize: 13, textAlign: 'left' }}>
                      {user?.address || 'No address added'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                component="form"
                onSubmit={handleProfileSubmit}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  mb: 3,
                  borderRadius: '14px',
                  bgcolor: '#F5F8FB'
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Fraunces", serif',
                    fontWeight: 600,
                    fontSize: '1.15rem',
                    color: 'secondary.dark',
                    mb: 0.5
                  }}
                >
                  Personal details
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2.5 }}>
                  Keep your contact information current so we can reach you about your courses.
                </Typography>

                {profileError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                    {profileError}
                  </Alert>
                )}
                {profileSuccess && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
                    {profileSuccess}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={profileData.name}
                      onChange={handleProfileChange('name')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Contact number"
                      value={profileData.contactNo}
                      onChange={handleProfileChange('contactNo')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={profileData.address}
                      onChange={handleProfileChange('address')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={profileLoading}
                    startIcon={<SaveIcon />}
                    sx={{
                      px: 2.5,
                      py: 1.1,
                      borderRadius: '10px',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' }
                    }}
                  >
                    {profileLoading ? 'Saving…' : 'Save changes'}
                  </Button>
                </Box>
              </Box>

              <Box
                component="form"
                onSubmit={handlePasswordSubmit}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '14px',
                  bgcolor: '#F5F8FB'
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Fraunces", serif',
                    fontWeight: 600,
                    fontSize: '1.15rem',
                    color: 'secondary.dark',
                    mb: 0.5
                  }}
                >
                  Security
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2.5 }}>
                  Choose a new password that is at least 6 characters long.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
                    {success}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Current password"
                      type="password"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="New password"
                      type="password"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Confirm password"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      required
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<LockResetIcon />}
                    sx={{
                      px: 2.5,
                      py: 1.1,
                      borderRadius: '10px',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' }
                    }}
                  >
                    {loading ? 'Updating…' : 'Update password'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
      </PageShell>
    </Box>
  )
}

export default Profile
