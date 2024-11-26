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
  const [activeTab, setActiveTab] = useState('student')
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
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

        console.log('User:', user)
        console.log('Role:', user._id)

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
        backgroundImage: 'url("/background-images/4.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Paper 
        sx={{ 
          p: 4, 
          maxWidth: 450,
          width: '90%',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ mb: 3, textAlign: 'center', fontWeight: 500 }}
        >
          Login
        </Typography>

        <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              sx={{
                flex: 1,
                pb: 1.5,
                borderBottom: 2,
                borderColor: activeTab === 'student' ? 'primary.main' : 'transparent',
                color: activeTab === 'student' ? 'primary.main' : 'text.secondary'
              }}
              onClick={() => handleTabChange('student')}
            >
              Student
            </Button>
            <Button
              sx={{
                flex: 1,
                pb: 1.5,
                borderBottom: 2,
                borderColor: activeTab === 'admin' ? 'primary.main' : 'transparent',
                color: activeTab === 'admin' ? 'primary.main' : 'text.secondary'
              }}
              onClick={() => handleTabChange('admin')}
            >
              Admin
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            variant="outlined"
          />
          <TextField
            fullWidth
            placeholder="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: 4 }}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
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
            sx={{
              py: 1.5,
              borderRadius: 1,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default Login 