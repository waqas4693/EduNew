import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { postData, getData, putData } from '../../api/api'
import NumberInput from '../common/NumberInput'
import { debounce } from 'lodash'

const AddUnit = ({ courseId, editMode }) => {
  const [units, setUnits] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)
  const [numberError, setNumberError] = useState('')
  const [swapMode, setSwapMode] = useState(false)
  const [selectedUnits, setSelectedUnits] = useState([])
  const [insertMode, setInsertMode] = useState(false)

  const debouncedNameUpdate = useCallback(
    debounce(async (unitId, newName) => {
      try {
        const response = await putData(`units/${unitId}`, { name: newName })
        if (response.status === 200) {
          setUnits(prev => prev.map(unit => 
            unit._id === unitId ? { ...unit, name: newName } : unit
          ))
        }
      } catch (error) {
        console.error('Error updating unit name:', error)
        setError(error.response?.data?.message || 'Failed to update unit name')
      }
    }, 500),
    []
  )

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (editMode && courseId && courses.length > 0) {
      const course = courses.find(c => c._id === courseId)
      if (course) {
        setSelectedCourse(course)
        fetchExistingUnits(courseId)
      }
    }
  }, [editMode, courseId, courses])

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

  const fetchExistingUnits = async (courseId) => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      console.error('Error fetching existing units:', error)
      setError('Failed to fetch existing units')
    }
  }

  const fetchNextNumber = async selectedCourseId => {
    try {
      const response = await getData(`units/latest-number/${selectedCourseId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        if (!editMode) {
          setUnits([{
            name: '',
            number: response.data.nextNumber,
            courseId: selectedCourseId
          }])
        }
      }
    } catch (error) {
      console.error('Error fetching next number:', error)
      setError('Failed to fetch next unit number')
    }
  }

  const handleNumberChange = async (unitId, newNumber) => {
    try {
      setNumberError('')
      
      // Validate number
      if (newNumber < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Check for duplicates in current state
      const isDuplicate = units.some(
        unit => unit.number === newNumber && unit._id !== unitId
      )
      if (isDuplicate) {
        setNumberError('Number already exists')
        return
      }

      // Only update in backend if not in insert mode
      if (!insertMode) {
        // Update in backend
        const response = await putData(`units/${unitId}/number`, {
          newNumber,
          courseId: selectedCourse._id
        })

        if (response.status === 200) {
          // Update local state
          setUnits(prev => {
            const updated = prev.map(unit => {
              if (unit._id === unitId) {
                return { ...unit, number: newNumber }
              }
              return unit
            })
            return updated.sort((a, b) => a.number - b.number)
          })
        }
      } else {
        // In insert mode, just update the local state
        setUnits(prev => prev.map(unit => ({
          ...unit,
          number: newNumber
        })))
      }
    } catch (error) {
      console.error('Error updating unit number:', error)
      setNumberError(error.response?.data?.message || 'Failed to update number')
    }
  }

  const handleNameChange = (index, newName) => {
    setUnits(prev => {
      const updatedUnits = [...prev]
      updatedUnits[index] = {
        ...updatedUnits[index],
        name: newName
      }
      return updatedUnits
    })
  }

  const handleSwapClick = (unitId) => {
    if (swapMode) {
      // If already in swap mode, add to selection
      setSelectedUnits(prev => {
        if (prev.includes(unitId)) {
          // If already selected, remove it
          return prev.filter(id => id !== unitId)
        }
        if (prev.length < 2) {
          // If less than 2 selected, add it
          return [...prev, unitId]
        }
        return prev
      })
    } else {
      // Start swap mode with this unit selected
      setSwapMode(true)
      setSelectedUnits([unitId])
    }
  }

  const handleConfirmSwap = async () => {
    if (selectedUnits.length !== 2) {
      setError('Please select exactly two units to swap')
      return
    }

    try {
      setError('')
      const response = await postData('units/swap-numbers', {
        unitId1: selectedUnits[0],
        unitId2: selectedUnits[1]
      })
      if (response.status === 200) {
        // Reset swap mode and refresh units
        setSwapMode(false)
        setSelectedUnits([])
        await fetchExistingUnits(selectedCourse._id)
      }
    } catch (error) {
      console.error('Error swapping unit numbers:', error)
      setError(error.response?.data?.message || 'Failed to swap unit numbers')
    }
  }

  const handleCancelSwap = () => {
    setSwapMode(false)
    setSelectedUnits([])
  }

  const handleInsertClick = () => {
    setInsertMode(true)
    setUnits([{
      name: '',
      number: 1,
      courseId: selectedCourse?._id
    }])
  }

  const handleInsertSubmit = async () => {
    try {
      setError('')
      
      // Validate inputs
      if (!selectedCourse) {
        setError('Please select a course first')
        return
      }

      if (!units[0].name) {
        setError('Please enter a unit name')
        return
      }

      if (units[0].number < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Send insert request
      const response = await postData('units/insert', {
        newUnit: {
          name: units[0].name,
          number: units[0].number,
          courseId: selectedCourse._id
        }
      })

      if (response.status === 201) {
        setInsertMode(false)
        setUnits([])
        await fetchExistingUnits(selectedCourse._id)
      }
    } catch (error) {
      console.error('Error inserting unit:', error)
      setError(error.response?.data?.message || 'Failed to insert unit')
    }
  }

  const addNewUnit = () => {
    setUnits(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        courseId: selectedCourse._id
      }
    ])
  }

  const removeUnit = indexToRemove => {
    setUnits(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      return filtered.map((unit, index) => ({
        ...unit,
        number: nextNumber + index
      }))
    })
  }

  const handleUnitChange = (index, field, value) => {
    if (field === 'courseId') {
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
      if (editMode) {
        // Update existing units
        for (const unit of units) {
          await putData(`units/${unit._id}`, { name: unit.name })
        }
      } else {
        // Create new units
        const response = await postData('units', { units })
        if (response.status === 201) {
          setUnits([
            {
              name: '',
              number: nextNumber,
              courseId: selectedCourse?._id
            }
          ])
        }
      }
    } catch (error) {
      console.error('Error saving units:', error)
      setError(error.response?.data?.message || 'Failed to save units')
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
        disabled={editMode || insertMode}
        getOptionLabel={option => option?.name || ''}
        onChange={(_, newValue) => {
          setSelectedCourse(newValue)
          if (!editMode && !insertMode) {
            handleUnitChange(0, 'courseId', newValue?._id)
          }
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
            <NumberInput
              value={unit.number}
              onChange={(newNumber) => handleNumberChange(unit._id, newNumber)}
              disabled={!editMode && !insertMode}
              error={!!numberError}
              helperText={numberError}
            />

            <TextField
              fullWidth
              size='small'
              label='Unit Name'
              value={unit.name}
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
                onClick={() => handleSwapClick(unit._id)}
                sx={{
                  minWidth: '120px',
                  bgcolor: selectedUnits.includes(unit._id) ? 'primary.dark' : 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                {swapMode ? 'Select' : 'Swap Numbers'}
              </Button>
            )}

            {index > 0 && !editMode && !insertMode && (
              <IconButton
                onClick={() => removeUnit(index)}
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
            <Button
              variant="outlined"
              onClick={handleInsertClick}
              sx={{ ml: 2 }}
            >
              Insert Unit
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
                disabled={selectedUnits.length !== 2}
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
                  setUnits([])
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleInsertSubmit}
                disabled={!units[0]?.name || !selectedCourse}
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

export default AddUnit
