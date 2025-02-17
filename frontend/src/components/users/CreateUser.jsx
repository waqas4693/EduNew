import { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack
} from '@mui/material'
import { postData } from '../../api/api'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

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
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: 4, borderRadius: '16px' }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Create New User
            </Typography>
            <Typography
              variant="body1"
              sx={{ 
                mt: 1,
                fontSize: '18px',
                color: '#5B5B5B'
              }}
            >
              Please provide the details to create a new user account.
            </Typography>
          </Box>

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
      </Paper>
    </Box>
  )
}

export default CreateUser 