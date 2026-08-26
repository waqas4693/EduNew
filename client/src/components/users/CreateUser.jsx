import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack
} from '@mui/material'
import { postData } from '../../api/api'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PageShell from '../layout/PageShell'

const ROLES = [
  { value: 3, label: 'Assessor' },
  { value: 4, label: 'Moderator' },
  { value: 5, label: 'Verifier' }
]

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await postData('users/create', formData)
      
      if (response.status === 201) {
        setSuccess('User created successfully')
        setFormData({
          name: '',
          email: '',
          password: '',
          role: ''
        })
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      kicker="Users"
      title="Create New User"
      subtitle="Please provide the details to create a new user account."
    >
        <Stack spacing={2}>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={1.5}>
              {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>}

              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                width: '100%'
              }}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={handleChange('name')}
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
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
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

              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                width: '100%'
              }}>
                <TextField
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  required
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />

                <FormControl 
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                >
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleChange('role')}
                    required
                    label="Role"
                  >
                    {ROLES.map(role => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<PersonAddIcon />}
                sx={{ 
                  mt: 2,
                  px: 3,
                  alignSelf: 'end'
                }}
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </Stack>
          </form>
        </Stack>
    </PageShell>
  )
}

export default CreateUser 