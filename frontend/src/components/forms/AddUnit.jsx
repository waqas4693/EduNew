import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Divider,
  IconButton,
  Alert
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { postData, getData, putData } from '../../api/api'

const AddUnit = ({ courseId, editMode }) => {
  const [units, setUnits] = useState([
    {
      name: '',
      number: null,
      courseId: null
    }
  ])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
        if (editMode && courseId) {
          const course = response.data.data.find(c => c._id === courseId)
          setSelectedCourse(course)
          handleUnitChange(0, 'courseId', course?._id)
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Failed to fetch courses')
    }
  }

  const fetchNextNumber = async selectedCourseId => {
    try {
      const response = await getData(`units/latest-number/${selectedCourseId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        // Update the first unit's number
        setUnits(prev => [
          {
            ...prev[0],
            number: response.data.nextNumber
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching next number:', error)
      setError('Failed to fetch next unit number')
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [courseId, editMode])

  const addNewUnit = () => {
    setUnits(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        courseId: prev[0].courseId
      }
    ])
  }

  const removeUnit = indexToRemove => {
    setUnits(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      // Recalculate numbers for remaining units
      return filtered.map((unit, index) => ({
        ...unit,
        number: nextNumber + index
      }))
    })
  }

  const handleUnitChange = (index, field, value) => {
    if (field === 'courseId') {
      // When course changes, fetch new number sequence
      fetchNextNumber(value)
      setUnits(prev =>
        prev.map((unit, idx) => ({
          ...unit,
          courseId: value,
          number: nextNumber + idx
        }))
      )
    } else {
      setUnits(prev => {
        const newUnits = [...prev]
        newUnits[index] = {
          ...newUnits[index],
          [field]: value
        }
        return newUnits
      })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    try {
      const response = await postData('units', { units })
      if (response.status === 201) {
        // Reset form
        setUnits([
          {
            name: '',
            number: nextNumber,
            courseId: selectedCourse?._id
          }
        ])
      }
    } catch (error) {
      console.error('Error creating units:', error)
      setError(error.response?.data?.message || 'Failed to create units')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Autocomplete
        options={courses}
        value={selectedCourse}
        disabled={editMode}
        getOptionLabel={option => option?.name || ''}
        onChange={(_, newValue) => {
          setSelectedCourse(newValue)
          handleUnitChange(0, 'courseId', newValue?._id)
        }}
        renderInput={params => (
          <TextField
            {...params}
            label='Select Course'
            required
            size='small'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        )}
        sx={{ mb: 2 }}
      />

      {units.map((unit, index) => (
        <Box key={index}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography
              sx={{
                width: '150px',
                padding: '8px 14px',
                bgcolor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #20202033'
              }}
            >
              Unit No: {unit.number}
            </Typography>

            <TextField
              fullWidth
              size='small'
              label='Unit Name'
              value={unit.name}
              onChange={e => handleUnitChange(index, 'name', e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />

            {index > 0 && !editMode && (
              <>
                <IconButton
                  onClick={() => removeUnit(index)}
                  sx={{
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      ))}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {!editMode && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={addNewUnit}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <AddIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
              Add Another Unit
            </Typography>
          </Box>
        )}
        <Button
          type='submit'
          variant='contained'
          sx={{
            bgcolor: editMode ? 'success.main' : 'primary.main',
            '&:hover': {
              bgcolor: editMode ? 'success.dark' : 'primary.dark'
            }
          }}
        >
          {editMode ? 'Edit' : 'Save All'}
        </Button>
      </Box>
    </form>
  )
}

export default AddUnit
