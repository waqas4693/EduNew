import { useState, useEffect } from 'react'
import {
  Alert,
  Autocomplete,
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
  ArrowUpward
} from '@mui/icons-material'
import { postData, getData, patchData } from '../../api/api'

const AddSection = ({
  courseId: propsCourseId,
  editMode,
  builderMode = false,
  onStructureChange,
  onNotify
}) => {
  const [sections, setSections] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState(1)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (!builderMode) {
      fetchCourses()
    }
  }, [builderMode])

  useEffect(() => {
    if (builderMode && propsCourseId) {
      setSelectedCourse({ _id: propsCourseId })
      setCourseId(propsCourseId)
      return
    }

    if (editMode && propsCourseId && courses.length > 0) {
      const course = courses.find((item) => item._id === propsCourseId)
      if (course) {
        setSelectedCourse(course)
        setCourseId(course._id)
      }
    }
  }, [editMode, builderMode, propsCourseId, courses])

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
    } catch (fetchError) {
      console.error('Error fetching courses:', fetchError)
      setError('Failed to fetch courses')
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units || [])
      }
    } catch (fetchError) {
      console.error('Error fetching units:', fetchError)
      setError('Failed to fetch units')
    }
  }

  const fetchExistingSections = async (unitId) => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections || [])
      }
    } catch (fetchError) {
      console.error('Error fetching existing sections:', fetchError)
      setError('Failed to fetch existing sections')
    }
  }

  const fetchNextNumber = async (unitId) => {
    try {
      const response = await getData(`sections/latest-number/${unitId}`)
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        if (!editMode) {
          setSections([
            {
              name: '',
              number: response.data.nextNumber,
              unitId
            }
          ])
        }
      }
    } catch (fetchError) {
      console.error('Error fetching next section number:', fetchError)
      setError('Failed to fetch next section number')
    }
  }

  const handleNameChange = (sectionKey, newName) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        const key = section._id || `draft-${idx}-${section.number}`
        return key === sectionKey ? { ...section, name: newName } : section
      })
    )
  }

  const handleMoveSection = async (index, direction) => {
    const orderedSections = [...sections].sort((a, b) => a.number - b.number)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const currentSection = orderedSections[index]
    const adjacentSection = orderedSections[targetIndex]

    if (!currentSection?._id || !adjacentSection?._id) {
      return
    }

    setReordering(true)
    setError('')

    try {
      await postData('sections/swap-numbers', {
        sectionId1: currentSection._id,
        sectionId2: adjacentSection._id
      })

      await fetchExistingSections(selectedUnit._id)
      onStructureChange?.()
      onNotify?.('Section order updated.')
    } catch (moveError) {
      console.error('Error reordering section:', moveError)
      setError(moveError?.data?.message || 'Failed to reorder sections')
    } finally {
      setReordering(false)
    }
  }

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit)
    setSections([])

    if (unit?._id) {
      if (editMode || builderMode) {
        fetchExistingSections(unit._id)
      } else {
        fetchNextNumber(unit._id)
      }
    }
  }

  const addNewSection = async () => {
    if (!selectedUnit?._id) {
      setError('Please select a unit first.')
      return
    }

    try {
      const response = await getData(`sections/latest-number/${selectedUnit._id}`)
      const number = response.data?.nextNumber || sections.length + 1
      setSections((prev) => [
        ...prev,
        {
          name: '',
          number,
          unitId: selectedUnit._id
        }
      ])
    } catch {
      setSections((prev) => [
        ...prev,
        {
          name: '',
          number: prev.length + 1,
          unitId: selectedUnit._id
        }
      ])
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedUnit?._id) {
      setError('Please select a unit first.')
      return
    }

    try {
      if (editMode) {
        const existingSections = sections.filter((section) => section._id)
        const newSections = sections.filter((section) => !section._id && section.name?.trim())

        for (const section of existingSections) {
          await patchData(`sections/${section._id}`, { name: section.name })
        }

        if (newSections.length) {
          await postData('sections', { sections: newSections })
        }

        await fetchExistingSections(selectedUnit._id)
        onStructureChange?.()
        onNotify?.('Sections saved successfully.')
      } else {
        const response = await postData('sections', { sections })
        if (response.status === 201) {
          setSections([
            {
              name: '',
              number: nextNumber,
              unitId: selectedUnit._id
            }
          ])
          onNotify?.('Sections saved successfully.')
        }
      }
    } catch (submitError) {
      console.error('Error saving sections:', submitError)
      setError(submitError?.data?.message || 'Failed to save sections')
    }
  }

  const sortedSections = [...sections].sort((a, b) => a.number - b.number)

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        {!builderMode && (
          <Autocomplete
            options={courses}
            value={selectedCourse}
            disabled={editMode}
            getOptionLabel={(option) => option?.name || ''}
            onChange={(_, newValue) => {
              setSelectedCourse(newValue)
              setCourseId(newValue?._id)
              setSelectedUnit(null)
              setSections([])
            }}
            sx={{ flex: 1, minWidth: 200 }}
            renderInput={(params) => (
              <TextField {...params} label="Course" size="small" required />
            )}
          />
        )}

        <Autocomplete
          options={units}
          value={selectedUnit}
          disabled={!courseId && !builderMode}
          getOptionLabel={(option) => option?.name || ''}
          onChange={(_, newValue) => handleUnitSelect(newValue)}
          sx={{ flex: 1, minWidth: 200 }}
          renderInput={(params) => (
            <TextField {...params} label="Unit" size="small" required />
          )}
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          borderColor: 'rgba(10, 37, 64, 0.12)'
        }}
      >
        {!selectedUnit ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Select a unit to manage its sections.
            </Typography>
          </Box>
        ) : sortedSections.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No sections yet. Add your first section to get started.
            </Typography>
          </Box>
        ) : (
          sortedSections.map((section, index) => {
            const sectionKey = section._id || `draft-${index}-${section.number}`

            return (
              <Box
                key={sectionKey}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: { xs: 1.5, sm: 2 },
                  py: 1.25,
                  borderBottom:
                    index < sortedSections.length - 1
                      ? '1px solid rgba(10, 37, 64, 0.08)'
                      : 'none',
                  bgcolor: index % 2 === 0 ? '#fff' : 'rgba(245, 248, 251, 0.7)'
                }}
              >
                <Chip
                  label={section.number}
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
                  placeholder="Section name"
                  value={section.name}
                  onChange={(event) => handleNameChange(sectionKey, event.target.value)}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
                />

                {section._id && (editMode || builderMode) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Tooltip title="Move up">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === 0 || reordering}
                          onClick={() => handleMoveSection(index, 'up')}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === sortedSections.length - 1 || reordering}
                          onClick={() => handleMoveSection(index, 'down')}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
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
          onClick={addNewSection}
          disabled={!selectedUnit}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add section
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={!selectedUnit}
          sx={{ borderRadius: '8px', minWidth: 120 }}
        >
          Save sections
        </Button>
      </Box>
    </Box>
  )
}

export default AddSection
