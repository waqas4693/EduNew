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

const AddResource = () => {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

  useEffect(() => {
    if (unitId) {
      fetchSections()
    }
  }, [unitId])

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

  const fetchUnits = async () => {
    try {
      const response = await fetch(`/api/units?courseId=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setUnits(data.data)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/sections?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setSections(data.data)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await postData('resources', { name, sectionId })
      if (response.status === 201) {
        setName('')
        setSectionId(null)
        setUnitId(null)
        setCourseId(null)
        alert('Resource added successfully')
      }
    } catch (error) {
      console.error('Error adding resource:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Add New Resource</Typography>
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
          <Autocomplete
            options={sections}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => setSectionId(newValue?._id)}
            disabled={!unitId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Section"
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <TextField
            fullWidth
            label="Resource Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth>
            Add Resource
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddResource 