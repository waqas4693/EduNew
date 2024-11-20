import { useState } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { postData } from '../../api/api'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'

const ADMIN_ROLE = 1
const STUDENT_ROLE = 2

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await postData('/auth', formData)
      
      if (response.status === 200) {
        const { token, user } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        login(user)

        if (user.role === ADMIN_ROLE) {
          navigate('/admin/dashboard', { replace: true })
        } else if (user.role === STUDENT_ROLE) {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Your account is currently inactive. Please contact administration.')
      } else if (error.response?.status === 404) {
        setError('User not found with this email.')
      } else if (error.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError('An error occurred. Please try again.')
      }
    }
  }

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100'
      }}
    >
      <Paper 
        sx={{ 
          p: 4, 
          maxWidth: 400,
          width: '90%'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ mb: 4, textAlign: 'center' }}
        >
          Student Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default Login 