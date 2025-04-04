import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { postData, getData, putData } from '../../api/api'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import NumberInput from '../common/NumberInput'
import { debounce } from 'lodash'

const AddSection = ({ courseId: propsCourseId, editMode }) => {
  const [sections, setSections] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)
  const [numberError, setNumberError] = useState('')
  const [swapMode, setSwapMode] = useState(false)
  const [selectedSections, setSelectedSections] = useState([])
  const [insertMode, setInsertMode] = useState(false)

  const debouncedNameUpdate = useCallback(
    debounce(async (sectionId, newName) => {
      try {
        const response = await putData(`sections/${sectionId}`, { name: newName })
        if (response.status === 200) {
          setSections(prev => prev.map(section => 
            section._id === sectionId ? { ...section, name: newName } : section
          ))
        }
      } catch (error) {
        console.error('Error updating section name:', error)
        setError(error.response?.data?.message || 'Failed to update section name')
      }
    }, 500),
    []
  )

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (editMode && propsCourseId && courses.length > 0) {
      const course = courses.find(c => c._id === propsCourseId)
      if (course) {
        setSelectedCourse(course)
        setCourseId(course._id)
      }
    }
  }, [editMode, propsCourseId, courses])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

  useEffect(() => {
    if (editMode && units.length > 0) {
      // Set the first unit as selected by default
      setSelectedUnit(units[0])
      fetchExistingSections(units[0]._id)
    }
  }, [units, editMode])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
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

  const fetchExistingSections = async (unitId) => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error fetching existing sections:', error)
      setError('Failed to fetch existing sections')
    }
  }

  const fetchNextNumber = async selectedUnitId => {
    try {
      const response = await getData(`sections/latest-number/${selectedUnitId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        if (!editMode) {
          setSections([{
            name: '',
            number: response.data.nextNumber,
            unitId: selectedUnitId
          }])
        }
      }
    } catch (error) {
      console.error('Error fetching next number:', error)
      setError('Failed to fetch next section number')
    }
  }

  const handleNumberChange = async (sectionId, newNumber) => {
    try {
      setNumberError('')
      
      // Validate number
      if (newNumber < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Check for duplicates in current state
      const isDuplicate = sections.some(
        section => section.number === newNumber && section._id !== sectionId
      )
      if (isDuplicate) {
        setNumberError('Number already exists')
        return
      }

      // Only update in backend if not in insert mode
      if (!insertMode) {
        // Update in backend
        const response = await putData(`sections/${sectionId}/number`, {
          newNumber,
          unitId: selectedUnit._id
        })

        if (response.status === 200) {
          // Update local state
          setSections(prev => {
            const updated = prev.map(section => {
              if (section._id === sectionId) {
                return { ...section, number: newNumber }
              }
              return section
            })
            return updated.sort((a, b) => a.number - b.number)
          })
        }
      } else {
        // In insert mode, just update the local state
        setSections(prev => prev.map(section => ({
          ...section,
          number: newNumber
        })))
      }
    } catch (error) {
      console.error('Error updating section number:', error)
      setNumberError(error.response?.data?.message || 'Failed to update number')
    }
  }

  const handleNameChange = (index, newName) => {
    setSections(prev => {
      const updatedSections = [...prev]
      updatedSections[index] = {
        ...updatedSections[index],
        name: newName
      }
      return updatedSections
    })
  }

  const handleSwapClick = (sectionId) => {
    if (swapMode) {
      // If already in swap mode, add to selection
      setSelectedSections(prev => {
        if (prev.includes(sectionId)) {
          // If already selected, remove it
          return prev.filter(id => id !== sectionId)
        }
        if (prev.length < 2) {
          // If less than 2 selected, add it
          return [...prev, sectionId]
        }
        return prev
      })
    } else {
      // Start swap mode with this section selected
      setSwapMode(true)
      setSelectedSections([sectionId])
    }
  }

  const handleConfirmSwap = async () => {
    if (selectedSections.length !== 2) {
      setError('Please select exactly two sections to swap')
      return
    }

    try {
      setError('')
      const response = await postData('sections/swap-numbers', {
        sectionId1: selectedSections[0],
        sectionId2: selectedSections[1]
      })
      if (response.status === 200) {
        // Reset swap mode and refresh sections
        setSwapMode(false)
        setSelectedSections([])
        await fetchExistingSections(selectedUnit._id)
      }
    } catch (error) {
      console.error('Error swapping section numbers:', error)
      setError(error.response?.data?.message || 'Failed to swap section numbers')
    }
  }

  const handleCancelSwap = () => {
    setSwapMode(false)
    setSelectedSections([])
  }

  const handleInsertClick = () => {
    setInsertMode(true)
    setSections([{
      name: '',
      number: 1,
      unitId: selectedUnit?._id
    }])
  }

  const handleInsertSubmit = async () => {
    try {
      setError('')
      
      // Validate course selection
      if (!selectedCourse) {
        setError('Please select a course first')
        return
      }

      // Validate unit selection
      if (!selectedUnit) {
        setError('Please select a unit first')
        return
      }

      // Validate number
      if (sections[0].number < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Validate name
      if (!sections[0].name) {
        setError('Please enter a section name')
        return
      }

      // Find the section that comes before our insertion point
      const response = await getData(`sections/${selectedUnit._id}`)
      if (response.status === 200 || response.status === 304) {
        const existingSections = response.data.sections
        const sectionsBeforeInsert = existingSections.filter(s => s.number < sections[0].number)
        const afterSectionId = sectionsBeforeInsert.length > 0 
          ? sectionsBeforeInsert[sectionsBeforeInsert.length - 1]._id 
          : null

        const insertResponse = await postData('sections/insert', {
          afterSectionId,
          newSection: {
            name: sections[0].name,
            number: sections[0].number,
            unitId: selectedUnit._id
          }
        })
        if (insertResponse.status === 201) {
          setInsertMode(false)
          setSections([])
          fetchExistingSections(selectedUnit._id)
        }
      } else {
        setError('Failed to fetch existing sections')
      }
    } catch (error) {
      console.error('Error inserting section:', error)
      setError(error.response?.data?.message || 'Failed to insert section')
    }
  }

  const addNewSection = () => {
    setSections(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        unitId: selectedUnit._id
      }
    ])
  }

  const removeSection = indexToRemove => {
    setSections(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      return filtered.map((section, index) => ({
        ...section,
        number: nextNumber + index
      }))
    })
  }

  const handleSectionChange = (index, field, value) => {
    if (field === 'unitId') {
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
      if (editMode) {
        // Update existing sections
        for (const section of sections) {
          await putData(`sections/${section._id}`, { name: section.name })
        }
      } else {
        // Create new sections
        const response = await postData('sections', { sections })
        if (response.status === 201) {
          setSections([
            {
              name: '',
              number: nextNumber,
              unitId: selectedUnit?._id
            }
          ])
        }
      }
    } catch (error) {
      console.error('Error saving sections:', error)
      setError(error.response?.data?.message || 'Failed to save sections')
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
          disabled={editMode || insertMode}
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
            if (!editMode && !insertMode) {
              handleSectionChange(0, 'unitId', newValue?._id)
            } else {
              fetchExistingSections(newValue._id)
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              size='small'
              label='Select Unit'
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
            <NumberInput
              value={section.number}
              onChange={(newNumber) => handleNumberChange(section._id, newNumber)}
              disabled={!editMode && !insertMode}
              error={!!numberError}
              helperText={numberError}
            />

            <TextField
              fullWidth
              size='small'
              label='Section Name'
              value={section.name}
              onChange={e => handleNameChange(index, e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />

            {editMode && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSwapClick(section._id)}
                sx={{
                  minWidth: '120px',
                  bgcolor: selectedSections.includes(section._id) ? 'primary.dark' : 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                {swapMode ? 'Select' : 'swapNumbers'}
              </Button>
            )}

            {index > 0 && !editMode && !insertMode && (
              <IconButton
                onClick={() => removeSection(index)}
                sx={{
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light', color: 'white' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      ))}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 2
        }}
      >
        {!editMode && !insertMode && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
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
            <Button
              variant="outlined"
              onClick={handleInsertClick}
              sx={{ ml: 2 }}
            >
              Insert Section
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          {swapMode && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmSwap}
                disabled={selectedSections.length !== 2}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Confirm Swap
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelSwap}
              >
                Cancel
              </Button>
            </>
          )}
          {insertMode && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setInsertMode(false)
                  setSections([])
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleInsertSubmit}
                disabled={!sections[0]?.name || !selectedUnit}
              >
                Insert
              </Button>
            </>
          )}
          {!insertMode && (
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
          )}
        </Box>
      </Box>
    </form>
  )
}

export default AddSection
