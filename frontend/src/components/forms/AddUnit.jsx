import { useState, useEffect } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Autocomplete
} from '@mui/material'
import { postData } from '../../api/api'

const AddUnit = () => {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleSubmit = async (e) => {
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
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Add New Unit</Typography>
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
          <TextField
            fullWidth
            label="Unit Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth>
            Add Unit
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddUnit 