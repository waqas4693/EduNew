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
import { postData, getData } from '../../api/api'

const AddUnit = () => {
  const [units, setUnits] = useState([{
    name: '',
    courseId: null
  }])
  const [courses, setCourses] = useState([])

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

  useEffect(() => {
    fetchCourses()
  }, [])

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
      const response = await postData('units', { units })
      if (response.status === 201) {
        setUnits([{ name: '', courseId: null }])
        alert('Units added successfully')
      }
    } catch (error) {
      console.error('Error adding units:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Autocomplete
        fullWidth
        size='small'
        options={courses}
        getOptionLabel={option => option.name}
        onChange={(_, newValue) => handleUnitChange(0, 'courseId', newValue?._id)}
        renderInput={params => (
          <TextField {...params} label='Select Course' required />
        )}
        sx={{ mb: 2 }}
      />

      {units.map((unit, index) => (
        <Box key={index}>
          {index > 0 && (
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
            sx={{ mb: 2 }}
          />
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={addNewUnit} sx={{ /* existing styles */ }}>
            <AddIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
            Add Another Unit
          </Typography>
        </Box>
        <Button type='submit' variant='contained' sx={{ /* existing styles */ }}>
          Save All
        </Button>
      </Box>
    </form>
  )
}

export default AddUnit
