import { useState } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
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

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await postData('/auth', formData)
      
      if (response.status === 200) {
        const { token, user } = response.data.data
        
        // Store token
        localStorage.setItem('token', token)
        
        // Store complete user data including studentId if present
        const userData = {
          ...user,  // This includes id, email, role, studentId, name, etc.
        }
        
        // Pass the complete userData to login
        login(userData)

        if (user.role === ADMIN_ROLE) {
          navigate('/admin/dashboard', { replace: true })
        } else if (user.role === STUDENT_ROLE) {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (error) {
      if (error.status === 403) {
        setDialogTitle('Account Inactive')
        setError('Your account is currently inactive. Please contact administration.')
      } else if (error.status === 404) {
        setDialogTitle('User Not Found')
        setError('User not found with this email.')
      } else if (error.status === 401) {
        setDialogTitle('Invalid Credentials')
        setError('Invalid email or password.')
      } else {
        setDialogTitle('Error')
        setError('An error occurred. Please try again.')
      }
      setOpenDialog(true)
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
          p: '60px',
          width: '40%',
          borderRadius: '16px'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ mb: 3, textAlign: 'center', fontWeight: 500 }}
        >
          eduSupplements
        </Typography>

        {/* <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
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
        </Box> */}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
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
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
            variant="outlined"
            slotProps={{
              input: {
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
              }
            }}
          />
          <Button 
            type="submit" 
            size="large"
            variant="contained"
            sx={{
              borderRadius: '8px',
              fontSize: '16px',
              textTransform: 'none',
              display: 'block',
              mx: 'auto',
              px: '30px'
            }}
          >
            Log In
          </Button>
        </form>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Typography>{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Login 