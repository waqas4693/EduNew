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
import { postData, getData, putData } from '../../api/api'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const AddSection = ({ courseId: propsCourseId, editMode }) => {
  const [sections, setSections] = useState([{
    name: '',
    unitId: null
  }])
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)

  useEffect(() => {
    fetchCourses()
    if (editMode && propsCourseId) {
      setCourseId(propsCourseId)
    }
  }, [editMode, propsCourseId])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

  useEffect(() => {
    if (selectedUnit) {
      fetchSections()
    }
  }, [selectedUnit])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
        if (editMode && propsCourseId) {
          const course = response.data.data.find(c => c._id === propsCourseId)
          setSelectedCourse(course)
        }
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

  const fetchSections = async () => {
    if (editMode && selectedUnit) {
      try {
        const response = await getData(`sections/${selectedUnit._id}`)
        if (response.status === 200 && response.data.sections) {
          setSections(response.data.sections.map(section => ({
            name: section.name,
            unitId: selectedUnit._id,
            _id: section._id
          })))
        }
      } catch (error) {
        console.error('Error fetching sections:', error)
      }
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
      if (editMode) {
        const updatePromises = sections.map(section => 
          putData(`sections/${section._id}`, {
            name: section.name,
            unitId: section.unitId
          })
        )
        
        await Promise.all(updatePromises)
        alert('Sections updated successfully')
      } else {
        const response = await postData('sections', { sections })
        if (response.status === 201) {
          setSections([{ name: '', unitId: null }])
          setCourseId(null)
          setSelectedUnit(null)
          alert('Sections added successfully')
        }
      }
    } catch (error) {
      console.error('Error handling sections:', error)
      alert('Error updating sections')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          fullWidth
          size='small'
          options={courses}
          value={selectedCourse}
          disabled={editMode}
          getOptionLabel={option => option?.name || ''}
          onChange={(_, newValue) => {
            setSelectedCourse(newValue)
            setCourseId(newValue?._id)
          }}
          renderInput={params => (
            <TextField {...params} label='Select Course' required />
          )}
        />
        <Autocomplete
          fullWidth
          size='small'
          options={units}
          value={selectedUnit}
          getOptionLabel={option => option?.name || ''}
          onChange={(_, newValue) => {
            setSelectedUnit(newValue)
            handleSectionChange(0, 'unitId', newValue?._id)
          }}
          disabled={!courseId}
          renderInput={params => (
            <TextField {...params} label='Select Unit' required />
          )}
        />
      </Box>

      {sections.map((section, index) => (
        <Box key={index}>
          {index > 0 && !editMode && (
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
        {!editMode && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={addNewSection}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <AddIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
              Add Another Section
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

export default AddSection
