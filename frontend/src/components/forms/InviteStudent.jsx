import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { PersonAdd, Close, CheckCircle, Error } from '@mui/icons-material'
import { getData, postData } from '../../api/api'

const InviteStudent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNo: '',
    address: '',
    courseId: null,
    isDemo: false
  })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Failed to load courses. Please refresh the page and try again.')
    }
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8
    const hasCapital = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    
    return {
      isValid: hasMinLength && hasCapital && hasNumber,
      errors: {
        minLength: !hasMinLength,
        capital: !hasCapital,
        number: !hasNumber
      }
    }
  }

  const validateContactNo = (contactNo) => {
    return contactNo.length >= 10
  }

  const validateForm = () => {
    const errors = {}

    // Required field validations
    if (!formData.name.trim()) {
      errors.name = 'Student name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        errors.password = 'Password must meet all requirements'
      }
    }

    if (!formData.contactNo.trim()) {
      errors.contactNo = 'Contact number is required'
    } else if (!validateContactNo(formData.contactNo)) {
      errors.contactNo = 'Please enter a valid contact number (minimum 10 digits)'
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }

    if (!formData.courseId) {
      errors.course = 'Please select a course'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear any existing messages when user starts typing
    if (error || success) {
      setError('')
      setSuccess('')
    }
  }

  const handleDemoChange = e => {
    setFormData({
      ...formData,
      isDemo: e.target.value === 'true'
    })
  }

  const handleCourseChange = (_, newValue) => {
    setSelectedCourse(newValue)
    setFormData(prev => ({ ...prev, courseId: newValue?._id }))
    
    // Clear course validation error
    if (validationErrors.course) {
      setValidationErrors(prev => ({
        ...prev,
        course: ''
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      contactNo: '',
      address: '',
      courseId: null,
      isDemo: false
    })
    setSelectedCourse(null)
    setValidationErrors({})
  }

  const handleSubmit = async e => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await postData('student', formData)
      
      if (response.data.success) {
        setSuccess(response.data.message)
        resetForm()
      } else {
        setError(response.data.message || 'Something went wrong')
      }
    } catch (err) {
      const errorMessage = err.data?.message || 
                          err.data?.error || 
                          'Failed to invite student. Please contact support.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPasswordHelperText = () => {
    const passwordValidation = validatePassword(formData.password)
    if (!formData.password) return "Minimum 8 characters, 1 capital letter, 1 number"
    
    const requirements = []
    if (passwordValidation.errors.minLength) requirements.push("8+ characters")
    if (passwordValidation.errors.capital) requirements.push("1 capital letter")
    if (passwordValidation.errors.number) requirements.push("1 number")
    
    return requirements.length > 0 ? `Missing: ${requirements.join(', ')}` : "✓ Password meets requirements"
  }

  return (
    <Paper sx={{ borderRadius: '16px', p: 2 }}>
      <Typography
        variant='h5'
        sx={{ mb: 1, fontWeight: 'bold', fontSize: '24px' }}
      >
        Invite Student
      </Typography>
      <Typography
        variant='body1'
        sx={{ mb: 2, fontSize: '18px', color: '#5B5B5B' }}
      >
        Please provide the details of the student to be added.
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Student Name'
            name='name'
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            error={!!validationErrors.name}
            helperText={validationErrors.name}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
              },
              '& .MuiInputLabel-root': {
                color: '#8F8F8F',
                backgroundColor: 'white',
                padding: '0 4px'
              }
            }}
          />
          <TextField
            fullWidth
            size='small'
            label='Email'
            name='email'
            type='email'
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
              },
              '& .MuiInputLabel-root': {
                color: '#8F8F8F',
                backgroundColor: 'white',
                padding: '0 4px'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Contact Number'
            name='contactNo'
            value={formData.contactNo}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            error={!!validationErrors.contactNo}
            helperText={validationErrors.contactNo}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
              },
              '& .MuiInputLabel-root': {
                color: '#8F8F8F',
                backgroundColor: 'white',
                padding: '0 4px'
              }
            }}
          />
          <TextField
            fullWidth
            size='small'
            label='Address'
            name='address'
            value={formData.address}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            error={!!validationErrors.address}
            helperText={validationErrors.address}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
              },
              '& .MuiInputLabel-root': {
                color: '#8F8F8F',
                backgroundColor: 'white',
                padding: '0 4px'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Autocomplete
            fullWidth
            size='small'
            options={courses}
            getOptionLabel={option => option.name}
            value={selectedCourse}
            onChange={handleCourseChange}
            disabled={isSubmitting}
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Course'
                required
                error={!!validationErrors.course}
                helperText={validationErrors.course}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    border: '1px solid #20202033',
                    '& fieldset': { border: 'none' }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#8F8F8F',
                    backgroundColor: 'white',
                    padding: '0 4px'
                  }
                }}
              />
            )}
          />
          <TextField
            fullWidth
            size='small'
            label='Password'
            name='password'
            type='password'
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            error={!!validationErrors.password}
            helperText={getPasswordHelperText()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
              },
              '& .MuiInputLabel-root': {
                color: '#8F8F8F',
                backgroundColor: 'white',
                padding: '0 4px'
              }
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControl component="fieldset" disabled={isSubmitting}>
            <FormLabel component="legend">Account Type</FormLabel>
            <RadioGroup
              row
              name="isDemo"
              value={formData.isDemo.toString()}
              onChange={handleDemoChange}
            >
              <FormControlLabel value="false" control={<Radio />} label="Regular Account" />
              <FormControlLabel value="true" control={<Radio />} label="Demo Account" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type='submit'
            variant='contained'
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            {isSubmitting ? 'Processing...' : 'Invite Student'}
          </Button>
        </Box>
      </form>

      {/* Success Dialog */}
      <Dialog
        open={!!success}
        onClose={() => setSuccess('')}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: '#f8fff8',
            border: '2px solid #4caf50'
          }
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 60, color: '#4caf50' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', fontWeight: 'bold' }}>
            Success!
          </Typography>
          <Typography variant="body1" sx={{ color: '#1b5e20' }}>
            {success}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setSuccess('')}
            variant="contained"
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#388e3c'
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={!!error}
        onClose={() => setError('')}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: '#fff8f8',
            border: '2px solid #f44336'
          }
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Error sx={{ fontSize: 60, color: '#f44336' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f', fontWeight: 'bold' }}>
            Error
          </Typography>
          <Typography variant="body1" sx={{ color: '#c62828' }}>
            {error}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setError('')}
            variant="contained"
            sx={{
              bgcolor: '#f44336',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default InviteStudent
