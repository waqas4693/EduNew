import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Autocomplete
} from '@mui/material'
import { getData, postData } from '../../api/api'

const InviteStudent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNo: '',
    address: '',
    courseId: null
  })
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    }
  }

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await postData('student', formData)
      setSuccess('Student invited successfully')
      setFormData({
        name: '',
        email: '',  
        password: '',
        contactNo: '',
        address: '',
        courseId: null
      })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
      setSuccess('')
    }
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
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Student Name'
            name='name'
            value={formData.name}
            onChange={handleChange}
            required
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
            onChange={(_, newValue) =>
              setFormData(prev => ({ ...prev, courseId: newValue?._id }))
            }
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Course'
                required
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type='submit'
            variant='contained'
            sx={{ borderRadius: '8px' }}
          >
            Invite Student
          </Button>
        </Box>
      </form>
    </Paper>
  )
}

export default InviteStudent
