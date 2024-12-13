import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  Divider,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { postData, getData, putData } from '../../api/api'

const AddUnit = ({ courseId, editMode }) => {
  const [units, setUnits] = useState([{
    name: '',
    courseId: null
  }])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

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
    }
  }

  const fetchUnits = async () => {
    if (editMode && courseId) {
      try {
        const response = await getData(`units/${courseId}`)
        if (response.status === 200 && response.data.units) {

          console.log('Units Fetched In Edit Mode = ')
          console.log(response.data.units)

          setUnits(response.data.units.map(unit => ({
            name: unit.name,
            courseId: courseId,
            _id: unit._id
          })))
        }
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchUnits()
  }, [courseId, editMode])

  const addNewUnit = () => {
    setUnits(prev => [...prev, { name: '', courseId: prev[0].courseId }])
  }

  const removeUnit = (indexToRemove) => {
    setUnits(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleUnitChange = (index, field, value) => {
    setUnits(prev => {
      const newUnits = [...prev]
      newUnits[index] = {
        ...newUnits[index],
        [field]: value
      }
      if (field === 'courseId') {
        newUnits.forEach(unit => unit.courseId = value)
      }
      return newUnits
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editMode) {
        const updatePromises = units.map(unit => 
          putData(`units/${unit._id}`, { 
            name: unit.name,
            courseId: unit.courseId 
          })
        )
        
        await Promise.all(updatePromises)
        alert('Units updated successfully')
      } else {
        const response = await postData('units', { units })
        if (response.status === 201) {
          setUnits([{ name: '', courseId: null }])
          alert('Units added successfully')
        }
      }
    } catch (error) {
      console.error('Error handling units:', error)
      alert('Error updating units')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Autocomplete
        fullWidth
        size='small'
        options={courses}
        value={selectedCourse}
        disabled={editMode}
        getOptionLabel={option => option?.name || ''}
        onChange={(_, newValue) => {
          setSelectedCourse(newValue)
          handleUnitChange(0, 'courseId', newValue?._id)
        }}
        renderInput={params => (
          <TextField {...params} label='Select Course' required sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}/>
        )}
        sx={{ mb: 2 }}
      />

      {units.map((unit, index) => (
        <Box key={index}>
          {index > 0 && !editMode && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <IconButton
                  onClick={() => removeUnit(index)}
                  sx={{
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.light', color: 'white' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Divider sx={{ my: 4 }} />
            </>
          )}
          
          <TextField
            fullWidth
            size='small'
            label='Unit Name'
            value={unit.name}
            onChange={e => handleUnitChange(index, 'name', e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
