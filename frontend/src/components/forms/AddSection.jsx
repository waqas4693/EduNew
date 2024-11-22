import { useState, useEffect } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Autocomplete
} from '@mui/material'
import { postData, getData } from '../../api/api'

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

  const handleSubmit = async (e) => {
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
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Add New Section</Typography>
        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={courses}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => setCourseId(newValue?._id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Course"
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <Autocomplete
            options={units}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => setUnitId(newValue?._id)}
            disabled={!courseId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Unit"
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <TextField
            fullWidth
            label="Section Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth>
            Add Section
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddSection 