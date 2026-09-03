import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import { getData, patchData } from '../../api/api'
import PageShell from '../layout/PageShell'

const UpdateUserPassword = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await getData('users')
        if (response.status === 200) {
          setUsers(response.data.data || [])
        }
      } catch (fetchError) {
        setError(fetchError?.data?.message || 'Failed to load users')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        label: `${user.name} (${user.email})`
      })),
    [users]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedUser) {
      setError('Please select a user')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)

    try {
      const response = await patchData(`users/${selectedUser._id}/password`, {
        newPassword
      })

      if (response.status === 200) {
        setSuccess(response.data.message || 'Password updated successfully')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (submitError) {
      setError(submitError?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      kicker="Accounts"
      title="Update user password"
      subtitle="Set a new password for any student or staff account without email reset."
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 520 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Autocomplete
            options={userOptions}
            loading={loadingUsers}
            value={selectedUser}
            onChange={(_, value) => {
              setSelectedUser(value)
              setError('')
              setSuccess('')
            }}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderOption={(props, option) => (
              <li {...props} key={option._id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                  <Box sx={{ fontWeight: 600 }}>{option.name}</Box>
                  <Box sx={{ fontSize: 13, color: 'text.secondary' }}>{option.email}</Box>
                  <Chip
                    size="small"
                    label={option.roleLabel}
                    sx={{ mt: 0.5, width: 'fit-content', fontWeight: 600 }}
                  />
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select user"
                size="small"
                required
                placeholder="Search by name or email"
              />
            )}
          />

          <TextField
            fullWidth
            size="small"
            type="password"
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            helperText="Minimum 6 characters"
          />

          <TextField
            fullWidth
            size="small"
            type="password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={<LockResetIcon />}
            disabled={saving || loadingUsers}
            sx={{ alignSelf: 'flex-start', borderRadius: '8px', minWidth: 180 }}
          >
            {saving ? 'Updating…' : 'Update password'}
          </Button>
        </Stack>
      </Box>
    </PageShell>
  )
}

export default UpdateUserPassword
