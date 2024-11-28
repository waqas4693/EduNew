import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  IconButton,
  Divider
} from '@mui/material'
import { postData, getData } from '../../api/api'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const AddSection = () => {
  const [sections, setSections] = useState([{
    name: '',
    unitId: null
  }])
  const [courseId, setCourseId] = useState(null)
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

  const addNewSection = () => {
    setSections(prev => [...prev, { name: '', unitId: prev[0].unitId }])
  }

  const removeSection = (indexToRemove) => {
    setSections(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSectionChange = (index, field, value) => {
    setSections(prev => {
      const newSections = [...prev]
      newSections[index] = {
        ...newSections[index],
        [field]: value
      }
      if (field === 'unitId') {
        newSections.forEach(section => section.unitId = value)
      }
      return newSections
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await postData('sections', { sections })
      if (response.status === 201) {
        setSections([{ name: '', unitId: null }])
        setCourseId(null)
        alert('Sections added successfully')
      }
    } catch (error) {
      console.error('Error adding sections:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          fullWidth
          options={courses}
          getOptionLabel={option => option.name}
          onChange={(_, newValue) => setCourseId(newValue?._id)}
          renderInput={params => (
            <TextField {...params} label='Select Course' required />
          )}
        />
        <Autocomplete
          fullWidth
          options={units}
          getOptionLabel={option => option.name}
          onChange={(_, newValue) => handleSectionChange(0, 'unitId', newValue?._id)}
          disabled={!courseId}
          renderInput={params => (
            <TextField {...params} label='Select Unit' required />
          )}
        />
      </Box>

      {sections.map((section, index) => (
        <Box key={index}>
          {index > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <IconButton
                  onClick={() => removeSection(index)}
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
            label='Section Name'
            value={section.name}
            onChange={e => handleSectionChange(index, 'name', e.target.value)}
            required
            sx={{ mb: 2 }}
          />
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={addNewSection} sx={{ /* existing styles */ }}>
            <AddIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
            Add Another Section
          </Typography>
        </Box>
        <Button type='submit' variant='contained' sx={{ /* existing styles */ }}>
          Save All
        </Button>
      </Box>
    </form>
  )
}

export default AddSection
