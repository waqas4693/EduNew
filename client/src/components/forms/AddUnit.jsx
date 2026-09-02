import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowDownward,
  ArrowUpward,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { postData, getData, patchData } from '../../api/api'

const AddUnit = ({ courseId, editMode, builderMode = false, onStructureChange, onNotify }) => {
  const [units, setUnits] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (!builderMode) {
      fetchCourses()
    }
  }, [builderMode])

  useEffect(() => {
    if (builderMode && courseId) {
      setSelectedCourse({ _id: courseId })
      fetchExistingUnits(courseId)
      return
    }

    if (editMode && courseId && courses.length > 0) {
      const course = courses.find((item) => item._id === courseId)
      if (course) {
        setSelectedCourse(course)
        fetchExistingUnits(courseId)
      }
    }
  }, [editMode, builderMode, courseId, courses])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (fetchError) {
      console.error('Error fetching courses:', fetchError)
      setError('Failed to fetch courses')
    }
  }

  const fetchExistingUnits = async (targetCourseId) => {
    try {
      const response = await getData(`units/${targetCourseId}`)
      if (response.status === 200) {
        setUnits(response.data.units || [])
      }
    } catch (fetchError) {
      console.error('Error fetching existing units:', fetchError)
      setError('Failed to fetch existing units')
    }
  }

  const fetchNextNumber = async (selectedCourseId) => {
    try {
      const response = await getData(`units/latest-number/${selectedCourseId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        if (!editMode) {
          setUnits([
            {
              name: '',
              number: response.data.nextNumber,
              courseId: selectedCourseId
            }
          ])
        }
      }
    } catch (fetchError) {
      console.error('Error fetching next number:', fetchError)
      setError('Failed to fetch next unit number')
    }
  }

  const handleNameChange = (unitKey, newName) => {
    setUnits((prev) =>
      prev.map((unit, idx) => {
        const key = unit._id || `draft-${idx}-${unit.number}`
        return key === unitKey ? { ...unit, name: newName } : unit
      })
    )
  }

  const handleMoveUnit = async (index, direction) => {
    const orderedUnits = [...units].sort((a, b) => a.number - b.number)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const currentUnit = orderedUnits[index]
    const adjacentUnit = orderedUnits[targetIndex]

    if (!currentUnit?._id || !adjacentUnit?._id) {
      return
    }

    setReordering(true)
    setError('')

    try {
      await postData('units/swap-numbers', {
        unitId1: currentUnit._id,
        unitId2: adjacentUnit._id
      })

      await fetchExistingUnits(selectedCourse?._id || courseId)
      onStructureChange?.()
      onNotify?.('Unit order updated.')
    } catch (moveError) {
      console.error('Error reordering unit:', moveError)
      setError(moveError?.data?.message || 'Failed to reorder units')
    } finally {
      setReordering(false)
    }
  }

  const addNewUnit = async () => {
    const activeCourseId = selectedCourse?._id || courseId

    if (editMode || builderMode) {
      try {
        const response = await getData(`units/latest-number/${activeCourseId}`)
        const number = response.data?.nextNumber || units.length + 1
        setUnits((prev) => [
          ...prev,
          {
            name: '',
            number,
            courseId: activeCourseId
          }
        ])
      } catch {
        setUnits((prev) => [
          ...prev,
          {
            name: '',
            number: prev.length + 1,
            courseId: activeCourseId
          }
        ])
      }
      return
    }

    setUnits((prev) => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        courseId: activeCourseId
      }
    ])
  }

  const removeUnit = (indexToRemove) => {
    setUnits((prev) => {
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
      setUnits((prev) =>
        prev.map((unit, idx) => ({
          ...unit,
          courseId: value,
          number: nextNumber + idx
        }))
      )
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (editMode) {
        const existingUnits = units.filter((unit) => unit._id)
        const newUnits = units.filter((unit) => !unit._id && unit.name?.trim())

        for (const unit of existingUnits) {
          await patchData(`units/${unit._id}`, { name: unit.name })
        }

        if (newUnits.length) {
          await postData('units', {
            units: newUnits.map((unit) => ({
              ...unit,
              courseId: selectedCourse?._id || courseId
            }))
          })
        }

        await fetchExistingUnits(selectedCourse?._id || courseId)
        onStructureChange?.()
        onNotify?.('Units saved successfully.')
      } else {
        const response = await postData('units', { units })
        if (response.status === 201) {
          setUnits([
            {
              name: '',
              number: nextNumber,
              courseId: selectedCourse?._id
            }
          ])
          onNotify?.('Units saved successfully.')
        }
      }
    } catch (submitError) {
      console.error('Error saving units:', submitError)
      setError(submitError?.data?.message || 'Failed to save units')
    }
  }

  const sortedUnits = [...units].sort((a, b) => a.number - b.number)

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {!builderMode && !editMode && (
        <TextField
          select
          fullWidth
          size="small"
          label="Select Course"
          value={selectedCourse?._id || ''}
          onChange={(event) => {
            const course = courses.find((item) => item._id === event.target.value)
            setSelectedCourse(course || null)
            if (course) {
              handleUnitChange(0, 'courseId', course._id)
            }
          }}
          SelectProps={{ native: true }}
          required
          sx={{ mb: 2, maxWidth: 420, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        >
          <option value="" disabled />
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name}
            </option>
          ))}
        </TextField>
      )}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          borderColor: 'rgba(10, 37, 64, 0.12)'
        }}
      >
        {sortedUnits.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No units yet. Add your first unit to get started.
            </Typography>
          </Box>
        ) : (
          sortedUnits.map((unit, index) => {
            const unitKey = unit._id || `draft-${index}-${unit.number}`

            return (
            <Box
              key={unitKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: { xs: 1.5, sm: 2 },
                py: 1.25,
                borderBottom:
                  index < sortedUnits.length - 1 ? '1px solid rgba(10, 37, 64, 0.08)' : 'none',
                bgcolor: index % 2 === 0 ? '#fff' : 'rgba(245, 248, 251, 0.7)'
              }}
            >
              <Chip
                label={unit.number}
                size="small"
                sx={{
                  minWidth: 40,
                  fontWeight: 700,
                  bgcolor: 'rgba(31, 126, 194, 0.12)',
                  color: 'primary.dark'
                }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Unit name"
                value={unit.name}
                onChange={(event) => handleNameChange(unitKey, event.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
              />

              {unit._id && (editMode || builderMode) && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0 || reordering}
                        onClick={() => handleMoveUnit(index, 'up')}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === sortedUnits.length - 1 || reordering}
                        onClick={() => handleMoveUnit(index, 'down')}
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}

              {!editMode && !builderMode && index > 0 && (
                <IconButton
                  size="small"
                  onClick={() => removeUnit(index)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            )
          })
        )}
      </Paper>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1.5,
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Button
          startIcon={<AddIcon />}
          onClick={addNewUnit}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add unit
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="success"
          sx={{ borderRadius: '8px', minWidth: 120 }}
        >
          Save units
        </Button>
      </Box>
    </Box>
  )
}

export default AddUnit
