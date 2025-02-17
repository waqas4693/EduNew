import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  IconButton,
  Divider,
  Alert
} from '@mui/material'
import { postData, getData, putData } from '../../api/api'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const AddSection = ({ courseId: propsCourseId, editMode }) => {
  const [sections, setSections] = useState([
    {
      name: '',
      number: null,
      unitId: null
    }
  ])
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)

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
      setError('Failed to fetch courses')
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
      setError('Failed to fetch units')
    }
  }

  const fetchNextNumber = async selectedUnitId => {
    try {
      const response = await getData(`sections/latest-number/${selectedUnitId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        // Update the first section's number
        setSections(prev => [
          {
            ...prev[0],
            number: response.data.nextNumber
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching next number:', error)
      setError('Failed to fetch next section number')
    }
  }

  const addNewSection = () => {
    setSections(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        unitId: prev[0].unitId
      }
    ])
  }

  const removeSection = indexToRemove => {
    setSections(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      // Recalculate numbers for remaining sections
      return filtered.map((section, index) => ({
        ...section,
        number: nextNumber + index
      }))
    })
  }

  const handleSectionChange = (index, field, value) => {
    if (field === 'unitId') {
      // When unit changes, fetch new number sequence
      fetchNextNumber(value)
      setSections(prev =>
        prev.map((section, idx) => ({
          ...section,
          unitId: value,
          number: nextNumber + idx
        }))
      )
    } else {
      setSections(prev => {
        const newSections = [...prev]
        newSections[index] = {
          ...newSections[index],
          [field]: value
        }
        return newSections
      })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    try {
      const response = await postData('sections', { sections })
      if (response.status === 201) {
        // Reset form
        setSections([
          {
            name: '',
            number: nextNumber,
            unitId: selectedUnit?._id
          }
        ])
      }
    } catch (error) {
      console.error('Error creating sections:', error)
      setError(error.response?.data?.message || 'Failed to create sections')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          options={courses}
          value={selectedCourse}
          disabled={editMode}
          getOptionLabel={option => option?.name || ''}
          onChange={(_, newValue) => {
            setSelectedCourse(newValue)
            setCourseId(newValue?._id)
            setSelectedUnit(null)
          }}
          renderInput={params => (
            <TextField
              {...params}
              label='Select Course'
              size='small'
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          )}
          sx={{ flex: 1 }}
        />

        <Autocomplete
          options={units}
          value={selectedUnit}
          getOptionLabel={option => option?.name || ''}
          onChange={(_, newValue) => {
            setSelectedUnit(newValue)
            handleSectionChange(0, 'unitId', newValue?._id)
          }}
          renderInput={params => (
            <TextField
              {...params}
              label='Select Unit'
              size='small'
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          )}
          sx={{ flex: 1 }}
        />
      </Box>

      {sections.map((section, index) => (
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
              Section No: {section.number}
            </Typography>

            <TextField
              fullWidth
              size='small'
              label='Section Name'
              value={section.name}
              onChange={e => handleSectionChange(index, 'name', e.target.value)}
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
                  onClick={() => removeSection(index)}
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
