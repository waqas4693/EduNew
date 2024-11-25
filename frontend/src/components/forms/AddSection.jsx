import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  IconButton
} from '@mui/material'
import { postData, getData } from '../../api/api'
import AddIcon from '@mui/icons-material/Add'

const AddSection = () => {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

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

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await postData('sections', { name, unitId })
      if (response.status === 201) {
        setName('')
        setUnitId(null)
        setCourseId(null)
        alert('Section added successfully')
      }
    } catch (error) {
      console.error('Error adding section:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          fullWidth
          size='small'
          options={courses}
          getOptionLabel={(option) => option.name}
          onChange={(_, newValue) => setCourseId(newValue?._id)}
          renderInput={(params) => (
            <TextField
              {...params}
              size='small'
              label='Select Course'
              required
              sx={{
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
        <Autocomplete
          fullWidth
          size='small'
          options={units}
          getOptionLabel={(option) => option.name}
          onChange={(_, newValue) => setUnitId(newValue?._id)}
          disabled={!courseId}
          renderInput={(params) => (
            <TextField
              {...params}
              size='small'
              label='Select Unit'
              required
              sx={{
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
      </Box>
      <TextField
        fullWidth
        size='small'
        label='Section Name'
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
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
            Add Section
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

export default AddSection
