import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { postData, getData } from '../../api/api'
import { IconButton } from '@mui/material'

const AddUnit = () => {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])

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

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await postData('units', { name, courseId })
      if (response.status === 201) {
        setName('')
        setCourseId(null)
        alert('Unit added successfully')
      }
    } catch (error) {
      console.error('Error adding unit:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Autocomplete
        fullWidth
        size='small'
        options={courses}
        getOptionLabel={option => option.name}
        onChange={(_, newValue) => setCourseId(newValue?._id)}
        renderInput={params => (
          <TextField
            {...params}
            size='small'
            label='Select Course'
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': {
                  border: 'none'
                }
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
        label='Unit Name'
        value={name}
        onChange={e => setName(e.target.value)}
        required
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            border: '1px solid #20202033',
            '& fieldset': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: '#8F8F8F'
          }
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 30,
              height: 30,
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
            Add Unit
          </Typography>
        </Box>
        <Button
          type='submit'
          variant='contained'
          sx={{ 
            minWidth: '100px',
            width: '100px',
            borderRadius: '8px',
            height: '36px'
          }}
        >
          Save
        </Button>
      </Box>
    </form>
  )
}

export default AddUnit
